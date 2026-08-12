import PageHeader from "../components/PageHeader";
import DestinationsGrid from "../components/DestinationsGrid";
import TourRail from "../components/TourRail";
import CtaBand from "../components/CtaBand";
import { filterProductByCategory, sortByPrice } from "../products/product";

export const metadata = {
  title: "Destinations",
  description:
    "Montego Bay, Ocho Rios, Negril, Falmouth and the South Coast — every parish PPP Tran Tours covers, and what's worth seeing in each.",
};

export default function DestinationsPage() {
  const popular = sortByPrice(filterProductByCategory("mpt"));

  return (
    <>
      <PageHeader
        eyebrow="Where we go"
        title="One island, five bases, every parish."
        description="We run out of Montego Bay and reach the whole island. Pick a coast — we'll get you there and back the same day, at your pace."
        image="/ppp/banner-fisherman-mobay.jpg"
        breadcrumbs={[{ label: "Destinations" }]}
      />

      <DestinationsGrid heading={false} />

      <div className="shell">
        <div className="hairline" />
      </div>

      <TourRail
        eyebrow="Start here"
        title="The tours we'd book first."
        description="If it's your first time on the island, these are the days that make the trip."
        href="/tours"
        tours={popular}
      />

      <CtaBand />
    </>
  );
}
