/**
 * Tests for MapPanel (TASK-RF-023.2) — the persistent vaul bottom sheet.
 * `vaul` is mocked inline (jsdom can't run it — no pointer capture/ResizeObserver);
 * the mock exposes the Root config as data-attributes and captures
 * setActiveSnapPoint. Real gesture behavior is validated manually on device.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { ReactNode } from "react";

const { capturedSetSnap } = vi.hoisted(() => ({
  capturedSetSnap: { current: null as ((value: number | string | null) => void) | null },
}));

vi.mock("vaul", async () => {
  const { useEffect } = await import("react");

  interface RootProps {
    children?: ReactNode;
    open?: boolean;
    modal?: boolean;
    dismissible?: boolean;
    snapPoints?: (number | string)[];
    activeSnapPoint?: number | string | null;
    setActiveSnapPoint?: (value: number | string | null) => void;
  }

  const Root = ({ children, open, modal, dismissible, snapPoints, activeSnapPoint, setActiveSnapPoint }: RootProps) => {
    useEffect(() => {
      capturedSetSnap.current = setActiveSnapPoint ?? null;
    });
    return (
      <div
        data-testid="vaul-root"
        data-open={String(!!open)}
        data-modal={String(!!modal)}
        data-dismissible={String(!!dismissible)}
        data-snap-points={JSON.stringify(snapPoints)}
        data-active-snap={String(activeSnapPoint)}
      >
        {children}
      </div>
    );
  };

  return {
    Drawer: {
      Root,
      Portal: ({ children }: { children?: ReactNode }) => <>{children}</>,
      Overlay: () => null,
      Content: ({ children, className }: { children?: ReactNode; className?: string }) => (
        <div data-testid="vaul-content" className={className}>
          {children}
        </div>
      ),
      Title: ({ children, className }: { children?: ReactNode; className?: string }) => <h2 className={className}>{children}</h2>,
      Handle: () => <div data-testid="vaul-handle" />,
    },
  };
});

import { MapPanel } from "../../../../components/map/panel/MapPanel";
import { UI_LABELS } from "../../../../constants/uiLabels";

const renderPanel = (extra?: Partial<Parameters<typeof MapPanel>[0]>) =>
  render(
    <MapPanel header={<div>cabecalho-do-painel</div>} footer={<div>rodape-cta</div>} {...extra}>
      <div>corpo-do-painel</div>
    </MapPanel>
  );

describe("MapPanel", () => {
  it("renders header, body and footer slots", () => {
    renderPanel();

    expect(screen.getByText("cabecalho-do-painel")).toBeInTheDocument();
    expect(screen.getByText("corpo-do-painel")).toBeInTheDocument();
    expect(screen.getByText("rodape-cta")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ARIA)).toBeInTheDocument(); // sr-only title
  });

  it("is configured as a persistent non-modal sheet (always open, never dismissible)", () => {
    renderPanel();

    const root = screen.getByTestId("vaul-root");
    expect(root).toHaveAttribute("data-open", "true");
    expect(root).toHaveAttribute("data-modal", "false");
    expect(root).toHaveAttribute("data-dismissible", "false");
    expect(root).toHaveAttribute("data-snap-points", JSON.stringify(["224px", 0.45, 0.9]));
  });

  it("starts collapsed when uncontrolled", () => {
    renderPanel();

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");
  });

  it("honors the controlled snap prop", () => {
    renderPanel({ snap: "half" });

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
  });

  it("reports snap changes through onSnapChange (drag settle)", () => {
    const onSnapChange = vi.fn();
    renderPanel({ onSnapChange });

    act(() => {
      capturedSetSnap.current?.(0.9);
    });

    expect(onSnapChange).toHaveBeenCalledWith("full");
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.9");
  });
});
