export class YouTubeUtil {
  public static getChannelUrl(channelId: string) {
    return `https://www.youtube.com/channel/${channelId}`
  }

  public static getVideoUrl(videoId: string) {
    return `https://www.youtube.com/watch?v=${videoId}`
  }
}
