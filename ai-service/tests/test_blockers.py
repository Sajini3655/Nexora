from main import extract_blockers


def test_ai_server_is_down_is_detected_as_blocker():
    messages = [{"message": "The AI server is down and we cannot proceed."}]

    blockers = extract_blockers(messages)

    assert "AI service is down" in blockers


def test_content_field_ai_server_down_is_detected_as_blocker():
    messages = [{"content": "The AI server is down and we cannot proceed."}]

    blockers = extract_blockers(messages)

    assert "AI service is down" in blockers


def test_content_field_with_no_message_is_safe():
    messages = [{"content": "Everything is working fine."}]

    blockers = extract_blockers(messages)

    assert blockers == []
