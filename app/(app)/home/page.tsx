"use client"
import React, { useState, useEffect, useCallback} from 'react'
import axios from 'axios'
import VideoCard from '@/app/components/VideoCard'
import { Video} from '@/types'

function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get('/api/video')
      if(Array.isArray(response.data)){
        setVideos(response.data)
      } else {
        throw new Error("Invalid data returned from API")
      }
    }
    catch (_error) {
      console.error("failed to load")
      setError("Failed to fetch videos")
      
    } finally {
      setLoading(false)
    }
   
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleDownload = useCallback((url: string, title: string) => {
    () => {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${title}.mp4`);
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    }

}, [])

if(loading){
    return <div>Loading...</div>
}
    
  return (
    <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-teal-500 to-red-500 text-transparent bg-clip-text">Videos</h1>
    {videos.length === 0 ? (
      <div className="text-center text-lg text-gray-500 bg-gradient-to-r from-purple-500 via-teal-500 to-red-500 text-transparent bg-clip-text">
        No videos available
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {
          videos.map((video:any) => (
              <VideoCard
                  key={video.id}
                  video={video}
                  onDownload={handleDownload}
              />
          ))
        }
      </div>
    )}
  </div>
  )
}

export default Home