export interface AdminStatsDTO {
  usersTotal: number;
  usersActive30d: number;
  postsTotal: number;
  commentsTotal: number;

  postsReportedPending: number;
  commentsReportedPending: number;

  postsFlagged: number;
  likesTotal: number;
  dislikesTotal: number;
  viewsTotal: number;

  trend: {
    users: number;
    posts: number;
    comments: number;
  };
}
