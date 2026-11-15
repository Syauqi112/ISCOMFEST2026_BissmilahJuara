import { Suspense } from "react";
import { Loading } from "@/components/states";
import { LonjakanClient } from "./lonjakan-client";

/**
 * `params` adalah request-time data. Di Cache Components, membacanya harus di
 * dalam <Suspense> supaya sisa halaman tetap bisa diprerender.
 */
async function Isi({ params }: { params: PageProps<"/lonjakan/[id]">["params"] }) {
  const { id } = await params;
  return <LonjakanClient id={id} />;
}

export default function LonjakanPage(props: PageProps<"/lonjakan/[id]">) {
  return (
    <Suspense fallback={<Loading judul="Menyiapkan halaman..." />}>
      <Isi params={props.params} />
    </Suspense>
  );
}
