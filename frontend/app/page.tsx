import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import CreatePostBox from "@/components/feed/CreatePostBox";
import FeedList from "@/components/feed/FeedList";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml lg:mr-72 min-h-[calc(100vh-3.5rem)] px-4 py-5">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <CreatePostBox />
            <FeedList />
          </div>
        </main>

        <div
          className="hidden lg:flex flex-col fixed top-14 right-0 bottom-0 w-72 border-l border-white/[0.06] overflow-y-auto"
          style={{ background: "#0d1020" }}
        >
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
