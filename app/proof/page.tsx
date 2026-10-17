import { ProofView } from "../../components/ProofView";

export default function ProofPage({ searchParams }: { searchParams: { hash?: string } }) {
  return <ProofView initialHash={searchParams.hash || ""} />;
}
