import json
import unittest
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image
from pydantic import ValidationError

from api import app
from code_analysis import CodeAnalysis
from jovi_ai import analyse_code


def result(**changes):
    return {
        "status": "ok", "language": "Python", "subject": "Saudação",
        "content": "Exibe uma saudação.", "original_code": 'print("Olá")',
        "corrected_code": None, "explanation": ["Exibe Olá no console."],
        "issues": [], **changes,
    }


class CodeTests(unittest.TestCase):
    def test_healthy(self):
        self.assertIsNone(CodeAnalysis.model_validate(result()).corrected_code)

    def test_no_code(self):
        parsed = CodeAnalysis.model_validate(result(
            status="no_code", language="", original_code="", explanation=[]))
        self.assertEqual(parsed.status, "no_code")

    def test_invalid_line_and_correction(self):
        for data in [
            result(issues=[dict(line=2, severity="erro", title="Erro", description="Fora")]),
            result(corrected_code="print(1)"),
            result(explanation=[]),
        ]:
            with self.assertRaises(ValidationError):
                CodeAnalysis.model_validate(data)

    @patch("jovi_ai._get_client")
    def test_gemini_contract(self, client):
        client.return_value.models.generate_content.return_value = SimpleNamespace(
            text=json.dumps(result()))
        response = analyse_code(Image.new("RGB", (2, 2)))
        self.assertEqual(response["analysis_type"], "code")
        config = client.return_value.models.generate_content.call_args.kwargs["config"]
        self.assertEqual(config["response_mime_type"], "application/json")
        self.assertIn("response_json_schema", config)

    @patch("jovi_ai._get_client")
    def test_bad_provider_response(self, client):
        client.return_value.models.generate_content.return_value = SimpleNamespace(text="oops")
        with self.assertRaises(RuntimeError):
            analyse_code(Image.new("RGB", (2, 2)))

    def test_upload_and_failure(self):
        image = BytesIO()
        Image.new("RGB", (2, 2)).save(image, format="PNG")
        client = TestClient(app)
        with patch("api.analyse_image", return_value={"analysis_type": "code", **result()}) as analyse:
            response = client.post("/api/codigo", files={"image": ("code.png", image.getvalue(), "image/png")})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(analyse.call_args.args[1], "code")
        with patch("api.analyse_image", side_effect=RuntimeError("private details")):
            response = client.post("/api/codigo", files={"image": ("code.png", image.getvalue(), "image/png")})
            self.assertEqual(response.status_code, 502)
            self.assertNotIn("private details", response.text)
        self.assertEqual(client.post("/api/codigo",
            files={"image": ("bad.png", b"bad", "image/png")}).status_code, 400)
        self.assertEqual(client.post("/api/codigo").status_code, 422)


if __name__ == "__main__":
    unittest.main()
