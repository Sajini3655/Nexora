from main import extract_blockers


def test_ai_server_is_down_is_detected_as_blocker():
    messages = [{"message": "The AI server is down and we cannot proceed."}]

    blockers = extract_blockers(messages)

    assert "AI service is down" in blockers
