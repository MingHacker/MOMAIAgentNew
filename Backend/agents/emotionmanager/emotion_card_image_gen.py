from openai import OpenAI

client = OpenAI()

def generate_emotion_card_image(message: str, months_old: int, baby_name: str) -> str:
    image_prompt = f"A warm, soft baby milestone card for {baby_name} turning {months_old} months. Include a quote: '{message}', white background, emotional tone"
    
    image = client.images.generate(
        model="dall-e-3",
        prompt=image_prompt,
        n=1,
        size="1024x1024"
    )
    
    return image.data[0].url
