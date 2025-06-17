from flask import Flask, request, jsonify
from flask_cors import CORS
from summarizer import summarize_transcript
from youtube_transcript_api import YouTubeTranscriptApi
from googletrans import Translator

app = Flask(__name__)
CORS(app)

# Helper to extract video ID from YouTube URL
def get_video_id(url):
    if "watch?v=" in url:
        return url.split("watch?v=")[-1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[-1].split("?")[0]
    return url

# Helper to format time for .srt format
def format_srt_time(seconds):
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02}:{mins:02}:{secs:02},{millis:03}"

# POST /summarize
@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.get_json()
        url = data.get('url')
        summary = summarize_transcript(url)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"summary": f"Error: {str(e)}"})

# POST /srt
@app.route('/srt', methods=['POST'])
def get_srt():
    try:
        data = request.get_json()
        url = data.get('url')
        video_id = get_video_id(url)
        transcript = YouTubeTranscriptApi.get_transcript(video_id)

        srt_output = ""
        for i, entry in enumerate(transcript):
            start = format_srt_time(entry['start'])
            end = format_srt_time(entry['start'] + entry['duration'])
            text = entry['text']
            srt_output += f"{i+1}\n{start} --> {end}\n{text}\n\n"

        return jsonify({"srt": srt_output})
    except Exception as e:
        return jsonify({"srt": f"Error: {str(e)}"})

# POST /translate
@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        url = data.get('url')
        lang = data.get('lang', 'en')
        video_id = get_video_id(url)
        transcript = YouTubeTranscriptApi.get_transcript(video_id)

        translator = Translator()
        translated_lines = []
        for entry in transcript:
            translated = translator.translate(entry['text'], dest=lang).text
            translated_lines.append(f"[{entry['start']:.2f}s] {translated}")

        return jsonify({"translation": "\n".join(translated_lines)})
    except Exception as e:
        return jsonify({"translation": f"Error: {str(e)}"})

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
