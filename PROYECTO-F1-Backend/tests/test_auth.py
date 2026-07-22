import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status

from app.main import app
from app.modules.auth import models, schemas

client = TestClient(app)

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

@patch("app.modules.auth.router.crud")
@patch("app.modules.auth.router.send_verification_email")
def test_register_user_success(mock_send_email, mock_crud, mock_db):
    mock_crud.get_usuario_by_correo.return_value = None
    
    user_mock = models.Usuario(
        id="11111111-1111-1111-1111-111111111111",
        nombre="Juan Perez",
        correo="juan@example.com",
        rol_id=1,
        activo=True,
        correo_verificado=False
    )
    mock_crud.crear_usuario.return_value = user_mock
    mock_crud.crear_codigo_verificacion.return_value = "123456"
    
    # We override get_db to return our mock DB
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/register",
            json={"nombre": "Juan Perez", "correo": "juan@example.com", "password": "password123"}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["correo"] == "juan@example.com"
        mock_send_email.assert_called_once_with("juan@example.com", "123456")
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
def test_register_user_already_registered(mock_crud, mock_db):
    mock_crud.get_usuario_by_correo.return_value = MagicMock() # User already exists
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/register",
            json={"nombre": "Juan Perez", "correo": "juan@example.com", "password": "password123"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "correo ya está registrado" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
@patch("app.modules.auth.router.verify_password")
def test_login_success(mock_verify, mock_crud, mock_db):
    user_mock = models.Usuario(
        id="11111111-1111-1111-1111-111111111111",
        nombre="Juan Perez",
        correo="juan@example.com",
        password_hash="hashed_pass",
        activo=True,
        correo_verificado=True
    )
    mock_crud.get_usuario_by_correo.return_value = user_mock
    mock_verify.return_value = True
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/login",
            data={"username": "juan@example.com", "password": "password123"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
@patch("app.modules.auth.router.verify_password")
def test_login_invalid_credentials(mock_verify, mock_crud, mock_db):
    mock_crud.get_usuario_by_correo.return_value = None
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/login",
            data={"username": "juan@example.com", "password": "password123"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
def test_verify_email_success(mock_crud, mock_db):
    mock_crud.validar_codigo_verificacion.return_value = True
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/verify-email",
            json={"correo": "juan@example.com", "codigo": "123456"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "Correo verificado correctamente"
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
def test_verify_email_invalid_code(mock_crud, mock_db):
    mock_crud.validar_codigo_verificacion.return_value = False
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/verify-email",
            json={"correo": "juan@example.com", "codigo": "000000"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    finally:
        app.dependency_overrides.clear()

@patch("app.modules.auth.router.crud")
@patch("app.modules.auth.router.send_password_reset_email")
def test_forgot_password(mock_send_email, mock_crud, mock_db):
    user_mock = models.Usuario(
        id="11111111-1111-1111-1111-111111111111",
        correo="juan@example.com"
    )
    mock_crud.get_usuario_by_correo.return_value = user_mock
    mock_crud.crear_reset_token.return_value = "reset_token_123"
    
    from app.database import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        response = client.post(
            "/auth/forgot-password",
            json={"correo": "juan@example.com"}
        )
        assert response.status_code == status.HTTP_200_OK
        mock_send_email.assert_called_once_with("juan@example.com", "reset_token_123")
    finally:
        app.dependency_overrides.clear()
