export class TwitCastingUtil {
  public static getUserUrl(userId: string) {
    return `https://twitcasting.tv/${userId}`
  }

  public static getMovieUrl(userId: string, movieId: string) {
    return `${this.getUserUrl(userId)}/movie/${movieId}`
  }
}
