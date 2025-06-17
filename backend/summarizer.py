from youtube_transcript_api import YouTubeTranscriptApi
from transformers import pipeline

# Load the summarizer model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Extract video ID from a YouTube URL
def get_video_id(url):
    if "watch?v=" in url:
        return url.split("watch?v=")[-1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[-1].split("?")[0]
    return url

# Main function to summarize transcript
def summarize_transcript(url):
    video_id = get_video_id(url)
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    full_text = " ".join([entry['text'] for entry in transcript])

    # Break text into chunks (because model can't handle long inputs)
    max_chunk_size = 1000
    chunks = [full_text[i:i+max_chunk_size] for i in range(0, len(full_text), max_chunk_size)]

    # Summarize each chunk
    summary_parts = []
    for chunk in chunks:
        summary = summarizer(chunk, max_length=130, min_length=30, do_sample=False)[0]['summary_text']
        summary_parts.append(summary)

    # Combine all summaries
    return "\n\n".join(summary_parts)
