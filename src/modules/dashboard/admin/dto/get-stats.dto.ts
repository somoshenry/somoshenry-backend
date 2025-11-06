export interface AdminStatsDTO {
  // USERS
  usersTotal: number;
  usersActive30d: number;
  usersNew30d: number;
  bannedUsers: number;

  // POSTS
  postsTotal: number;
  postsNew30d: number;
  postsFlagged: number;

  // COMMENTS
  commentsTotal: number;

  // REPORTS
  postsReportedPending: number;
  commentsReportedPending: number;
  pendingReportsTotal: number;
  reportsResolved: number;

  // REACTIONS
  likesTotal: number;
  dislikesTotal: number;

  // ENGAGEMENT
  viewsTotal: number;

  // TRENDS
  trend: {
    users: number;
    posts: number;
    comments: number;
  };
}
