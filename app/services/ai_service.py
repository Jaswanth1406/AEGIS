import httpx

from app.core.config import settings

async def generate_threat_analysis(threat_data: dict, shap_values: list[dict]) -> str | None:
    if not settings.ai_api_key:
        return None

    # Construct the prompt
    prompt = f"""
    Analyze the following threat event and its SHAP feature importance values. 
    Provide a concise, 1-2 sentence executive summary of what happened and why the model flagged it, 
    based primarily on the features with the highest SHAP values.

    Threat Details:
    - Type: {threat_data.get('threat_type')}
    - Severity: {threat_data.get('severity')}
    - Source IP: {threat_data.get('source_ip')}
    - Target System: {threat_data.get('target_system')}

    SHAP Values (Feature Importance):
    {shap_values}
    """

    url = f"https://aipipe.org/geminiv1beta/models/{settings.ai_model}:generateContent"
    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Extract the generated text from Gemini's response structure
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
            
            return None
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return None
