import React from "react";
import { UI_LABELS } from "../constants/uiLabels";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface Props {
  searchAT: string;
  searchResult: string | null;
  onChange: (val: string) => void;
  onSelectResult: (route: string) => void;
  clearSearch: () => void;
}

export const RouteSearchByAT: React.FC<Props> = ({ searchAT, searchResult, onChange, onSelectResult, clearSearch }) => (
  <div className="text-center m-4">
    <Input className="mx-auto w-80 max-w-full" placeholder={UI_LABELS.ROUTE_SEARCH.PLACEHOLDER} value={searchAT} onChange={(e) => onChange(e.target.value)} />

    {searchResult && (
      <div className="mt-3 flex items-center justify-center">
        {searchResult === "NONE" ? (
          <div className="animate-pulse rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive">{UI_LABELS.ROUTE_SEARCH.NOT_FOUND}</div>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="group gap-2 font-bold"
            onClick={() => {
              onSelectResult(searchResult);
              onChange("");
              clearSearch();
            }}
          >
            {searchResult}
            <span aria-hidden className="text-primary transition-transform group-hover:translate-x-1">
              ➔
            </span>
          </Button>
        )}
      </div>
    )}
  </div>
);
