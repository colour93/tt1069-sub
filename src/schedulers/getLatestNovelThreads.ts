import { updateNovelThreadList } from "../tt1069/novel/updateNovelThreadList";

export const getLatestNovelThreads = async () => {
  console.log("开始获取最新小说帖子");
  await updateNovelThreadList();
};
