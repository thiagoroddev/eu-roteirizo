import React from "react";
import { EXAMPLE_TABLE_DATA, EXAMPLE_TABLE_COLUMNS } from "../constants/exampleData";
import { UI_LABELS } from "../constants/uiLabels";

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
  // w-full, NÃO w-screen: 100vw dentro do container com padding da HOME é mais largo
  // que a área útil do pai e empurra a página inteira na horizontal (TASK-BG-010).
  // A rolagem da tabela é do quadro interno (overflow-auto), nunca do body.
  return (
    <div className="mt-8 w-full max-w-6xl">
      <h6 className="text-base font-semibold mb-1">{UI_LABELS.EXAMPLE_TABLE.TITLE}</h6>

      <div className="overflow-auto rounded-xl shadow-sm border border-border bg-primary/5 m-4">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-primary/90 text-primary-foreground">
            <tr className="text-center align-middle">
              {EXAMPLE_TABLE_COLUMNS.map((col) => (
                <th key={col.key} className="p-2 border border-border">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_TABLE_DATA.map((row) => (
              <tr key={row.sequence} className="text-center align-middle odd:bg-muted">
                <td className="p-2 border border-border">{row.sequence}</td>
                <td className="p-2 border border-border">{row.stop}</td>
                <td className="p-2 border border-border">{row.numOfOrder}</td>
                <td className="p-2 border border-border">{row.totalDistance}</td>
                <td className="p-2 border border-border">{row.zipcode}</td>
                <td className="p-2 border border-border">{row.date}</td>
                <td className="p-2 border border-border">{row.shiftTime}</td>
                <td className="p-2 border border-border">{row.destinationAddress}</td>
                <td className="p-2 border border-border">{row.city}</td>
                <td className="p-2 border border-border">{row.neighborhood}</td>
                <td className="p-2 border border-border">{row.latitude}</td>
                <td className="p-2 border border-border">{row.longitude}</td>
                <td className="p-2 border border-border">{row.deliveryTime}</td>
                <td className="p-2 border border-border">{row.locationType}</td>
                <td className="p-2 border border-border">{row.plannedAt}</td>
                <td className="p-2 border border-border">{row.corridorCage}</td>
                <td className="p-2 border border-border">{row.hub}</td>
                <td className="p-2 border border-border">{row.plannedVehicle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
