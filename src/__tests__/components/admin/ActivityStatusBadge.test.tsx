import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityStatusBadge } from "../../../components/admin/ActivityStatusBadge";
import { FUTURE_ACTIVITY, PAST_ACTIVITY } from "../../../test/msw/handlers";

describe("ActivityStatusBadge", () => {
  it("affiche 'Supprimée' pour une activité supprimée", () => {
    render(<ActivityStatusBadge activity={{ ...FUTURE_ACTIVITY, deleted: true }} />);
    expect(screen.getByText("Supprimée")).toBeInTheDocument();
  });

  it("affiche 'À venir' pour une activité future", () => {
    render(<ActivityStatusBadge activity={FUTURE_ACTIVITY} />);
    expect(screen.getByText("À venir")).toBeInTheDocument();
  });

  it("affiche 'Passée' pour une activité passée", () => {
    render(<ActivityStatusBadge activity={PAST_ACTIVITY} />);
    expect(screen.getByText("Passée")).toBeInTheDocument();
  });
});
