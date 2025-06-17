import React, { useState } from 'react'
import axios from 'axios'

const YouTubeSummarizer = () => {
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [translated, setTranslated] = useState('')
  const [srtText, setSrtText] = useState('')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)

  const handleSummarize = async () => {
    try {
      setLoading(true)

      const res = await axios.post('http://localhost:5000/summarize', { url })
      const result = res.data.summary.toLowerCase()
      if (result.includes("could not retrieve a transcript")) {
        setSummary("❌ Sorry, this video doesn't have subtitles or a transcript.")
      } else if (result.startsWith("error")) {
        setSummary("⚠️ Oops! Something went wrong while summarizing this video.")
      } else {
        setSummary(res.data.summary)
      }

      // Fetch translation
      const transRes = await axios.post('http://localhost:5000/translate', {
        url,
        lang: language
      })
      setTranslated(transRes.data.translation)

      // Fetch SRT
      const srtRes = await axios.post('http://localhost:5000/srt', { url })
      setSrtText(srtRes.data.srt)

    } catch (err) {
      setSummary('🚫 Could not connect to backend. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  const downloadTextFile = (text, filename) => {
    const element = document.createElement("a")
    const file = new Blob([text], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", fontFamily: "Arial" }}>
      

      <input
        type="text"
        placeholder="Paste YouTube video URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <select
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={{ marginTop: "10px", padding: "5px" }}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
        <option value="ml">Malayalam</option>
        <option value="ta">Tamil</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
      </select>

      <button
        onClick={handleSummarize}
        disabled={loading}
        style={{ marginTop: "10px", padding: "8px 16px" }}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap", color: summary.startsWith("❌") || summary.startsWith("⚠️") || summary.startsWith("🚫") ? "crimson" : "black" }}>
        {summary}
      </div>

      {translated && !translated.toLowerCase().startsWith("error") && (
        <div style={{ marginTop: "20px", whiteSpace: "pre-wrap", color: "#007700" }}>
          <h4>🌐 Translated Transcript ({language.toUpperCase()}):</h4>
          {translated}
        </div>
      )}

      {summary && !summary.startsWith("❌") && !summary.startsWith("⚠️") && !summary.startsWith("🚫") && (
        <div style={{ marginTop: "15px" }}>
          <button onClick={() => downloadTextFile(summary, "summary.txt")} style={{ marginRight: "10px" }}>
            📄 Download Summary as .txt
          </button>
          {srtText && !srtText.toLowerCase().startsWith("error") && (
            <button onClick={() => downloadTextFile(srtText, "transcript.srt")}>
              🎬 Download Transcript as .srt
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default YouTubeSummarizer
