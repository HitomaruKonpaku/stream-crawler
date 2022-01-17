export class TwitCastingUtil {
  public static getMovieUrl(userId: string, movieId: string) {
    return `https://twitcasting.tv/${userId}/movie/${movieId}`
  }
}
