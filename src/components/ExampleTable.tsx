import React from "react";
import { EXAMPLE_TABLE_DATA, EXAMPLE_TABLE_COLUMNS } from "../constants/exampleData";

/**
 * ExampleTable - Displays sample Excel structure with fictional data
 *
 * Shows users the ideal column structure before uploading their file.
 * Disappears after successful file upload.
 * Data comes from constants/exampleData.ts
 *
 * @returns {JSX.Element} The rendered ExampleTable component
 */
export const ExampleTable: React.FC = () => {
  return (
    <div className="mt-8 w-screen max-w-6xl">
      <h6 className="text-base font-semibold mb-1">Exemplo de planilha ideal (dados fictícios)</h6>

      <div className="overflow-auto rounded-xl shadow-sm border border-slate-200 bg-primary/5 m-4">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-primary/90 text-white">
            <tr className="text-center align-middle">
              {EXAMPLE_TABLE_COLUMNS.map((col) => (
                <th key={col.key} className="p-2 border border-slate-200">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_TABLE_DATA.map((row) => (
              <tr key={row.sequence} className="text-center align-middle odd:bg-slate-50">
                <td className="p-2 border border-slate-200">{row.sequence}</td>
                <td className="p-2 border border-slate-200">{row.stop}</td>
                <td className="p-2 border border-slate-200">{row.numOfOrder}</td>
                <td className="p-2 border border-slate-200">{row.totalDistance}</td>
                <td className="p-2 border border-slate-200">{row.zipcode}</td>
                <td className="p-2 border border-slate-200">{row.date}</td>
                <td className="p-2 border border-slate-200">{row.shiftTime}</td>
                <td className="p-2 border border-slate-200">{row.destinationAddress}</td>
                <td className="p-2 border border-slate-200">{row.city}</td>
                <td className="p-2 border border-slate-200">{row.neighborhood}</td>
                <td className="p-2 border border-slate-200">{row.latitude}</td>
                <td className="p-2 border border-slate-200">{row.longitude}</td>
                <td className="p-2 border border-slate-200">{row.deliveryTime}</td>
                <td className="p-2 border border-slate-200">{row.locationType}</td>
                <td className="p-2 border border-slate-200">{row.plannedAt}</td>
                <td className="p-2 border border-slate-200">{row.corridorCage}</td>
                <td className="p-2 border border-slate-200">{row.hub}</td>
                <td className="p-2 border border-slate-200">{row.plannedVehicle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
