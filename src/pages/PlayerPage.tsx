import { useParams } from "react-router-dom";

const PlayerPage = () => {
  const { siteId } = useParams<{ siteId: string }>();
  return (
    <div className="flex items-center justify-center h-screen text-2xl text-gray-500">
      JoyCraft — 플레이어 (준비 중) · siteId: {siteId}
    </div>
  );
};
export default PlayerPage;
