import React from "react";
import { UI_LABELS } from "../constants/uiLabels";

interface Props {
  searchAT: string;
  searchResult: string | null;
  onChange: (val: string) => void;
  onSelectResult: (route: string) => void;
  clearSearch: () => void;
}

export const RouteSearchByAT: React.FC<Props> = ({ searchAT, searchResult, onChange, onSelectResult, clearSearch }) => (
  <div className="text-center m-4">
    <input
      className="w-80 inline-block mb-4 px-4 py-2 border border-primary rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      placeholder={UI_LABELS.ROUTE_SEARCH.PLACEHOLDER}
      value={searchAT}
      onChange={(e) => onChange(e.target.value)}
    />

    {searchResult && (
      <div className="bg-white flex items-center justify-center">
        {searchResult === "NONE" ? (
          <div className="p-2 bg-red-50 text-red-600 rounded-md border border-red-100 animate-pulse">{UI_LABELS.ROUTE_SEARCH.NOT_FOUND}</div>
        ) : (
          <button
            onClick={() => {
              onSelectResult(searchResult);
              onChange("");
              clearSearch();
            }}
            className="group w-50 flex items-center justify-between p-2 bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md hover:border-green-400 hover:bg-green-50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex flex-col text-left">
              <span className="text-lg font-bold text-gray-800 group-hover:text-green-700">{searchResult}</span>
            </div>
            <span className="text-green-500 text-2xl transform group-hover:translate-x-1 transition-transform">➔</span>
          </button>
        )}
      </div>
    )}
  </div>
);
