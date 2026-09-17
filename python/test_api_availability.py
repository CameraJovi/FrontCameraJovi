"""Offline regression tests: no real credentials or Gemini requests are used."""
from __future__ import annotations

import asyncio
import io
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, Mock, patch

import httpx
from fastapi.testclient import TestClient
from google.genai import errors
from PIL import Image

import api
import jovi_ai


KEYS = ["test-only-paid-key", "test-only-fallback-key", "test-only-last-key"]
QUOTA_MESSAGE = "Servico de analise temporariamente indisponivel. Tente novamente."
CODE = {
    "status": "ok", "language": "Python", "subject": "Saida",
    "content": "Exibe um numero.", "original_code": "print(1)",
    "corrected_code": None, "explanation": ["Exibe 1."], "issues": [],
}
SAMPLES = {
    "resumo": {"subject": "Aula", "content": "Resumo da aula."},
    "flashcards": {"subject": "Aula", "content": "Revisao.",
                   "cards": [{"question": "Quanto e 1+1?", "answer": "2"}]},
    "math": {"subject": "Soma", "expression": "1+1", "result": ["2"],
             "steps": [{"title": "Somar", "step": "Some 1 e 1."}], "content": "2"},
    "codigo": CODE,
}


def provider_error(code=429, status="RESOURCE_EXHAUSTED"):
    error_type = errors.ServerError if code >= 500 else errors.ClientError
    return error_type(code, {"error": {"code": code, "status": status,
                                       "message": " ".join(KEYS)}})


def png_bytes():
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), "white").save(buffer, format="PNG")
    return buffer.getvalue()


class GeminiFixture:
    def setUp(self):
        super().setUp()
        # Keep OS variables (notably TEMP on Windows); isolate only credentials.
        self.enterContext(patch.dict(os.environ))
        for name in ("GEMINI_API_KEY", "GEMINI_CODE_MODEL", "GOOGLE_API_KEY"):
            os.environ.pop(name, None)
        os.environ["GEMINI_API_KEYS"] = ",".join(KEYS)
        self.generate = Mock(return_value=SimpleNamespace(text=json.dumps(SAMPLES["resumo"])))
        self.clients = []

        def make_client(**kwargs):
            client = MagicMock()
            client.__enter__.return_value = client
            client.models.generate_content = self.generate
            self.clients.append(client)
            return client

        self.factory = self.enterContext(patch.object(jovi_ai.genai, "Client", side_effect=make_client))

    def attempted_keys(self):
        return [call.kwargs["api_key"] for call in self.factory.call_args_list]


class KeyConfigurationTests(GeminiFixture, unittest.TestCase):
    def test_plural_precedence_order_whitespace_empty_and_duplicates(self):
        os.environ["GEMINI_API_KEYS"] = " first , , second,first,third, "
        os.environ["GEMINI_API_KEY"] = "legacy"
        self.assertEqual(jovi_ai._get_api_keys(), ["first", "second", "third"])

    def test_legacy_key_when_plural_absent(self):
        del os.environ["GEMINI_API_KEYS"]
        os.environ["GEMINI_API_KEY"] = " legacy "
        self.assertEqual(jovi_ai._get_api_keys(), ["legacy"])

    def test_empty_plural_does_not_silently_use_legacy(self):
        os.environ["GEMINI_API_KEY"] = "legacy"
        for value in ["", " , , "]:
            with self.subTest(value=value):
                os.environ["GEMINI_API_KEYS"] = value
                with self.assertRaisesRegex(RuntimeError, "Configure GEMINI_API_KEYS"):
                    jovi_ai._get_api_keys()
        self.factory.assert_not_called()

    def test_no_keys_is_controlled_and_lazy(self):
        os.environ.clear()
        with self.assertRaisesRegex(RuntimeError, "Configure GEMINI_API_KEYS"):
            jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.factory.assert_not_called()


class FallbackTests(GeminiFixture, unittest.TestCase):
    def test_normal_operations_always_use_main(self):
        for _ in range(2):
            jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), [KEYS[0], KEYS[0]])
        for client in self.clients:
            client.__exit__.assert_called_once()

    def test_successive_quota_failures_replay_same_operation_then_restart_main(self):
        response = SimpleNamespace(text=json.dumps(SAMPLES["resumo"]))
        self.generate.side_effect = [provider_error(), provider_error(), response, response]
        picture = Image.new("RGB", (1, 1))
        first = jovi_ai.analyse_image(picture, "resumo")
        second = jovi_ai.analyse_image(picture, "resumo")
        self.assertEqual(first, second)
        self.assertEqual(self.attempted_keys(), [*KEYS, KEYS[0]])
        self.assertEqual(self.generate.call_args_list[0], self.generate.call_args_list[1])
        self.assertEqual(self.generate.call_args_list[1], self.generate.call_args_list[2])
        for client in self.clients:
            client.__exit__.assert_called_once()

    def test_structured_resource_exhausted_equivalent(self):
        self.generate.side_effect = [errors.APIError(0, {"status": "RESOURCE_EXHAUSTED"}),
                                     SimpleNamespace(text='{"subject":"Aula"}')]
        jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), KEYS[:2])

    def test_429_without_status_is_eligible(self):
        self.generate.side_effect = [errors.ClientError(429, {}),
                                     SimpleNamespace(text='{"subject":"Aula"}')]
        jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), KEYS[:2])

    def test_all_limited_is_sanitized_and_bounded(self):
        self.generate.side_effect = provider_error()
        with self.assertRaisesRegex(jovi_ai.GeminiQuotaExhausted, QUOTA_MESSAGE):
            jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), KEYS)

    def test_non_quota_errors_never_fall_back(self):
        failures = [provider_error(code, status) for code, status in [
            (400, "INVALID_ARGUMENT"), (401, "UNAUTHENTICATED"),
            (403, "PERMISSION_DENIED"), (404, "NOT_FOUND"),
            (500, "INTERNAL"), (503, "UNAVAILABLE"),
        ]] + [TimeoutError(KEYS[0]), ValueError("429 RESOURCE_EXHAUSTED " + KEYS[0])]
        for failure in failures:
            with self.subTest(error_type=type(failure).__name__, code=getattr(failure, "code", None)):
                self.factory.reset_mock()
                self.generate.side_effect = failure
                with self.assertRaises(jovi_ai.GeminiRequestError) as caught:
                    jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
                self.assertEqual(self.attempted_keys(), KEYS[:1])
                self.assertNotIn(KEYS[0], str(caught.exception))
                self.assertTrue(caught.exception.__suppress_context__)

    def test_auth_error_after_quota_stops_before_third_key(self):
        self.generate.side_effect = [provider_error(), provider_error(403, "PERMISSION_DENIED")]
        with self.assertRaises(jovi_ai.GeminiRequestError):
            jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), KEYS[:2])

    def test_constructor_failure_is_safe_and_does_not_fall_back(self):
        self.factory.side_effect = ValueError(KEYS[0])
        with self.assertRaises(jovi_ai.GeminiRequestError):
            jovi_ai.analyse_image(Image.new("RGB", (1, 1)), "resumo")
        self.assertEqual(self.attempted_keys(), KEYS[:1])

    def test_invalid_code_response_does_not_fall_back(self):
        self.generate.return_value = SimpleNamespace(text="not valid JSON")
        with self.assertRaises(RuntimeError):
            jovi_ai.analyse_code(Image.new("RGB", (1, 1)))
        self.assertEqual(self.attempted_keys(), KEYS[:1])

    def test_code_fallback_preserves_model_prompt_schema_and_image(self):
        os.environ["GEMINI_CODE_MODEL"] = "test-model"
        self.generate.side_effect = [provider_error(), SimpleNamespace(text=json.dumps(CODE))]
        picture = Image.new("RGB", (1, 1))
        result = jovi_ai.analyse_code(picture)
        self.assertEqual(result, {"analysis_type": "code", **CODE})
        self.assertEqual(self.attempted_keys(), KEYS[:2])
        self.assertEqual(self.generate.call_args_list[0], self.generate.call_args_list[1])
        self.assertEqual(self.generate.call_args.kwargs, {
            "model": "test-model", "contents": [picture],
            "config": {"system_instruction": jovi_ai.CODE_PROMPT,
                       "response_mime_type": "application/json",
                       "response_json_schema": jovi_ai.CodeAnalysis.model_json_schema()},
        })


class EndpointTests(GeminiFixture, unittest.TestCase):
    def setUp(self):
        super().setUp()
        self.client = self.enterContext(TestClient(api.app))

    def post_image(self, route, content=None, content_type="image/png"):
        return self.client.post("/api/" + route, files={
            "image": ("capture.png", png_bytes() if content is None else content, content_type)
        })

    def test_all_analysis_success_contracts_with_and_without_fallback(self):
        for route, sample in SAMPLES.items():
            for fallback in [False, True]:
                with self.subTest(route=route, fallback=fallback):
                    self.factory.reset_mock()
                    response = SimpleNamespace(text=json.dumps(sample))
                    self.generate.side_effect = [provider_error(), response] if fallback else [response]
                    result = self.post_image(route)
                    self.assertEqual(result.status_code, 200)
                    self.assertEqual(result.json(), {"analysis_type": "code" if route == "codigo" else route, **sample})
                    self.assertEqual(self.attempted_keys(), KEYS[:2] if fallback else KEYS[:1])

    def test_all_routes_return_controlled_503_without_secrets_in_logs_or_response(self):
        self.generate.side_effect = provider_error()
        with self.assertLogs(level="DEBUG") as captured:
            for route in SAMPLES:
                with self.subTest(route=route):
                    self.factory.reset_mock()
                    result = self.post_image(route)
                    self.assertEqual(result.status_code, 503)
                    self.assertEqual(result.json(), {"detail": QUOTA_MESSAGE})
                    self.assertEqual(self.attempted_keys(), KEYS)
                    for key in KEYS:
                        self.assertNotIn(key, result.text)
        for key in KEYS:
            self.assertNotIn(key, "\n".join(captured.output))

    def test_non_quota_http_errors_preserve_status_and_hide_provider_details(self):
        for route in SAMPLES:
            with self.subTest(route=route), self.assertLogs(level="DEBUG") as captured:
                self.factory.reset_mock()
                self.generate.side_effect = provider_error(401, "UNAUTHENTICATED")
                result = self.post_image(route)
                self.assertEqual(result.status_code, 502 if route == "codigo" else 500)
                self.assertEqual(self.attempted_keys(), KEYS[:1])
                for key in KEYS:
                    self.assertNotIn(key, result.text)
            for key in KEYS:
                self.assertNotIn(key, "\n".join(captured.output))

    def test_health_works_without_keys_and_never_constructs_gemini(self):
        os.environ.clear()
        self.factory.side_effect = AssertionError("Health must not construct Gemini")
        result = self.client.get("/api/health")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), {"status": "ok", "service": "camera-jovi-api"})
        self.factory.assert_not_called()

    def test_missing_keys_return_controlled_errors_on_analysis(self):
        os.environ.clear()
        for route in SAMPLES:
            result = self.post_image(route)
            self.assertEqual(result.status_code, 502 if route == "codigo" else 500)
            self.assertEqual(set(result.json()), {"detail"})
        self.factory.assert_not_called()

    def test_upload_validation_never_calls_gemini(self):
        for route in SAMPLES:
            for content, content_type in [(b"", "image/png"), (b"invalid", "image/png"),
                                          (b"text", "text/plain")]:
                with self.subTest(route=route, content_type=content_type):
                    self.assertEqual(self.post_image(route, content, content_type).status_code, 400)
            self.assertEqual(self.client.post("/api/" + route).status_code, 422)
        self.factory.assert_not_called()

    def test_no_code_contract_is_preserved(self):
        sample = {**CODE, "status": "no_code", "language": "", "original_code": "", "explanation": []}
        self.generate.return_value = SimpleNamespace(text=json.dumps(sample))
        result = self.post_image("codigo")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), {"analysis_type": "code", **sample})

    def test_existing_plain_text_summary_fallback_is_preserved(self):
        self.generate.return_value = SimpleNamespace(text="Texto sem JSON")
        result = self.post_image("resumo")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), {"analysis_type": "resumo", "subject": "Erro", "content": "Texto sem JSON"})
        self.assertEqual(self.attempted_keys(), KEYS[:1])

    def test_save_still_writes_analysis_without_gemini(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            with patch.object(jovi_ai, "BASE_DIR", base), patch.object(jovi_ai, "SAVED_DIR", base / "salvos"):
                for route, sample in SAMPLES.items():
                    result = self.client.post("/api/salvar", json={"materia": route,
                        "analysis": {"analysis_type": "code" if route == "codigo" else route, **sample}})
                    self.assertEqual(result.status_code, 200)
                    self.assertEqual(set(result.json()), {"status", "materia", "file_name", "file_path"})
                    self.assertEqual(result.json()["status"], "saved")
                    saved = base / result.json()["file_path"]
                    self.assertTrue(saved.is_file())
                    self.assertIn(sample["subject"], saved.read_text(encoding="utf-8"))
        self.factory.assert_not_called()


class ConcurrentHealthTests(GeminiFixture, unittest.IsolatedAsyncioTestCase):
    async def test_health_completes_while_each_analysis_is_waiting_on_gemini(self):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url="http://test") as client:
            for route, sample in SAMPLES.items():
                with self.subTest(route=route):
                    entered = threading.Event()
                    release = threading.Event()

                    def slow_provider(**kwargs):
                        entered.set()
                        if not release.wait(timeout=5):
                            raise TimeoutError("Test provider was not released")
                        return SimpleNamespace(text=json.dumps(sample))

                    self.generate.side_effect = slow_provider
                    operation = asyncio.create_task(client.post("/api/" + route, files={
                        "image": ("capture.png", png_bytes(), "image/png")
                    }))
                    try:
                        self.assertTrue(await asyncio.to_thread(entered.wait, 3))
                        health = await asyncio.wait_for(client.get("/api/health"), timeout=2)
                        self.assertEqual(health.status_code, 200)
                        self.assertFalse(operation.done(), "Analysis blocked the event loop")
                    finally:
                        release.set()
                        result = await operation
                    self.assertEqual(result.status_code, 200)


if __name__ == "__main__":
    unittest.main()
