export class TwitCastingUtil {
  public static getUserUrl(userId: string) {
    return `https://twitcasting.tv/${userId}`
  }

  public static getMovieUrl(userId: string, movieId: string) {
    return `${this.getUserUrl(userId)}/movie/${movieId}`
  }

  public static getUserImageUrl(user: any) {
    const searchString = 'https:'
    let url = String(user.image)
    if (!url.startsWith(searchString)) {
      url = searchString + url
    }
    return url
  }
}
