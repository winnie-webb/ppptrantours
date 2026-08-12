import PageHeader from "../components/PageHeader";
import TourGrid from "../components/TourGrid";
import CtaBand from "../components/CtaBand";
import { getAllProducts } from "../products/product";

export const metadata = {
  title: "All Tours & Transfers",
  description:
    "Every tour, excursion and airport transfer PPP Tran Tours runs across Jamaica — filter by category, price or destination.",
};

export default function ToursPage() {
  const tours = getAllProducts();

  return (
    <>
      <PageHeader
        eyebrow="The full catalogue"
        title="Every tour and transfer we run."
        description={`${tours.length} routes across nine parishes — from a five-dollar hotel hop on the Hip Strip to a full South Coast day at YS Falls, Black River and Appleton.`}
        image="/ppp/banner-ys-falls.jpg"
        breadcrumbs={[{ label: "Tours" }]}
      />

      <section className="shell py-14 lg:py-20">
        <TourGrid tours={tours} />
      </section>

      <CtaBand />
    </>
  );
}
