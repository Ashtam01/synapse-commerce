# ai-service/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from PIL import Image
import io
import uvicorn

app = FastAPI()

# 1. Load the AI Model (CLIP)
# We use 'clip-ViT-B-32' because it is the industry standard for 
# connecting Text and Images in the same vector space.
print("⏳ Loading Synapse AI Model... (This will download ~300MB on first run)")
model = SentenceTransformer('clip-ViT-B-32')
print("✅ Synapse Brain is Active!")

# Input Schema for Text
class TextRequest(BaseModel):
    text: str

# --- ROUTES ---

@app.get("/")
def home():
    return {"message": "Synapse Neural Engine is Running 🧠"}

# Endpoint 1: Convert Text -> Vector
@app.post("/vectorize/text")
async def vectorize_text(req: TextRequest):
    try:
        # The model converts text into a list of 512 numbers
        embedding = model.encode(req.text)
        return {"vector": embedding.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 2: Convert Image -> Vector
@app.post("/vectorize/image")
async def vectorize_image(file: UploadFile = File(...)):
    try:
        # Read image bytes
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # The model converts the image into the SAME 512-number space as text
        embedding = model.encode(image)
        return {"vector": embedding.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)