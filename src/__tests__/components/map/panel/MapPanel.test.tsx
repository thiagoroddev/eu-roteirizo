/**
 * Tests for MapPanel (TASK-RF-023.2) — the persistent vaul bottom sheet.
 * `vaul` is mocked inline (jsdom can't run it — no pointer capture/ResizeObserver);
 * the mock exposes the Root config as data-attributes and captures
 * setActiveSnapPoint. Real gesture behavior is validated manually on device.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
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

  /**
   * TASK-REF-019. The Content is `fixed` AND lives in a portal outside the
   * shell tree: no ancestor can constrain it, so losing this class is invisible
   * in every other test and only shows up as a panel spanning a whole monitor.
   */
  it("stays inside the app's centred column on wide screens (REF-019)", () => {
    renderPanel();

    expect(screen.getByTestId("vaul-content")).toHaveClass("app-frame");
  });

  it("is configured as a persistent non-modal sheet (always open, never dismissible)", () => {
    renderPanel();

    const root = screen.getByTestId("vaul-root");
    expect(root).toHaveAttribute("data-open", "true");
    expect(root).toHaveAttribute("data-modal", "false");
    expect(root).toHaveAttribute("data-dismissible", "false");
  });

  // The ladder is what lets a drag rest ~anywhere (RF-006.4.17): assert its
  // SHAPE, not a literal array — the rungs move with the viewport.
  it("offers a dense ladder of snap points, collapsed first, holding the named heights", () => {
    renderPanel();

    const snapPoints: (string | number)[] = JSON.parse(screen.getByTestId("vaul-root").getAttribute("data-snap-points") ?? "[]");
    expect(snapPoints[0]).toBe("224px");
    expect(snapPoints[snapPoints.length - 1]).toBe(0.85); // full
    expect(snapPoints).toContain(0.45); // half
    expect(snapPoints.length).toBeGreaterThan(10); // fine enough to feel free
    const fractions = snapPoints.slice(1) as number[];
    expect(fractions).toEqual([...fractions].sort((a, b) => a - b)); // vaul needs ascending
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
      capturedSetSnap.current?.(0.85);
    });

    expect(onSnapChange).toHaveBeenCalledWith("full");
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
  });

  // The heart of RF-006.4.17: an in-between height survives the parent echoing
  // its coarse label back. Without this the panel snapped to 0.45 and felt caged.
  it("KEEPS an in-between drag height when the parent re-asserts the same label", () => {
    const onSnapChange = vi.fn();
    const { rerender } = renderPanel({ snap: "collapsed", onSnapChange });

    act(() => {
      capturedSetSnap.current?.(0.62); // a rung between half and full
    });
    expect(onSnapChange).toHaveBeenCalledWith("half");

    rerender(
      <MapPanel snap="half" onSnapChange={onSnapChange} header={<div>header</div>}>
        <div>body</div>
      </MapPanel>
    );

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.62");
  });

  it("obeys a click that CHANGES the label, dropping the remembered drag height", () => {
    const onSnapChange = vi.fn();
    const { rerender } = renderPanel({ snap: "collapsed", onSnapChange });

    act(() => {
      capturedSetSnap.current?.(0.62);
    });

    rerender(
      <MapPanel snap="full" onSnapChange={onSnapChange} header={<div>header</div>}>
        <div>body</div>
      </MapPanel>
    );

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
  });

  // RF-006.4.26: vaul's release moves ONE rung per flick — ~2% of the screen on
  // the dense ladder, which read as "snapping back". A fast release overrides
  // the pick with the next NAMED height in the gesture's direction.
  it("a fast upward FLICK jumps to the next NAMED height, ignoring vaul's one-rung pick", () => {
    const onSnapChange = vi.fn();
    renderPanel({ onSnapChange }); // uncontrolled, starts collapsed

    // Fast upward gesture (clientY shrinking): the synchronous events land well
    // inside the sampling window, and the speed far exceeds the flick threshold.
    fireEvent.pointerDown(document.body, { clientY: 600 });
    fireEvent.pointerMove(document.body, { clientY: 560 });
    fireEvent.pointerMove(document.body, { clientY: 520 });
    fireEvent.pointerUp(document.body, { clientY: 520 });
    act(() => {
      capturedSetSnap.current?.(0.3); // vaul's one-rung pick near the origin — overridden
    });

    expect(onSnapChange).toHaveBeenCalledWith("half");
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
  });

  it("a fast downward FLICK steps down to the previous NAMED height", () => {
    const onSnapChange = vi.fn();
    const { rerender } = renderPanel({ snap: "full", onSnapChange });

    fireEvent.pointerDown(document.body, { clientY: 200 });
    fireEvent.pointerMove(document.body, { clientY: 260 });
    fireEvent.pointerUp(document.body, { clientY: 260 });
    act(() => {
      capturedSetSnap.current?.(0.8);
    });

    expect(onSnapChange).toHaveBeenCalledWith("half");
    rerender(
      <MapPanel snap="half" onSnapChange={onSnapChange} header={<div>header</div>}>
        <div>body</div>
      </MapPanel>
    );
    // The flick landed on the NAMED half — not on vaul's 0.8 rung.
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
  });
});
