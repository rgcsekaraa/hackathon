from datetime import timedelta

from core.auth import create_access_token, decode_token, get_password_hash, verify_password


def test_password_hash_roundtrip() -> None:
    password = "Demo1234!"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_create_and_decode() -> None:
    token = create_access_token({"sub": "user-123"}, expires_delta=timedelta(minutes=5))
    payload = decode_token(token)

    assert payload is not None
    assert payload.get("sub") == "user-123"
    assert "exp" in payload


def test_decode_token_rejects_invalid_token() -> None:
    payload = decode_token("not-a-valid-jwt")
    assert payload is None

