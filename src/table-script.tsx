import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

// Helper: convert fraction string to percentage string (e.g. "0.67" -> "67%"), defaulting to "0%"
const toPercentString = (val?: string): string => {
  if (!val) return "0%";
  const num = parseFloat(val);
  if (isNaN(num)) return "0%";
  return `${Math.round(num * 100)}%`;
};

// Determine key for previous month in "YYYY-MM" format
const getPrevMonthKey = (): string => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mm = String(prev.getMonth() + 1).padStart(2, "0");
  return `${prev.getFullYear()}-${mm}`;
};

// Static last three months labels (as per spec)
const monthLabels = ["May", "June", "July"];

// Prepare table data
const tableData: TableDataType[] = (sourceData as SourceDataType[])
  // Only include active employees and externals
  .filter((row) => {
    if (row.employees) {
      return row.employees.statusAggregation?.status !== "Inaktiv";
    }
    if (row.externals) {
      return row.externals.status === "active";
    }
    return false;
  })
  .map((row) => {
    const isEmp = Boolean(row.employees);
    const personEntity = isEmp ? row.employees! : row.externals!;
    const wu = personEntity.workforceUtilisation!;

    // Calculate percentages
    const past12Months = toPercentString(wu.utilisationRateOverall);
    const y2d = toPercentString(wu.utilisationRateYearToDate);
    const last3Rates = monthLabels.map((month) => {
      const entry = wu.lastThreeMonthsIndividually?.find((e) => e.month === month);
      return toPercentString(entry?.utilisationRate);
    });
    const [may, june, july] = last3Rates;

    // Net earnings previous month
    const prevKey = getPrevMonthKey();
    const earningsArr = isEmp
      ? (((row.employees!.costsByMonth as any)?.potentialEarningsByMonth) as { month: string; costs: string }[]) ?? []
      : row.externals!.costsByMonth?.costsByMonth ?? [];
    const earningsEntry = earningsArr.find((e) => e.month === prevKey);
    const amount = earningsEntry ? parseFloat(earningsEntry.costs) : 0;
    const netEarningsPrevMonth = `${isEmp ? amount : -amount} EUR`;

    return {
      person: `${personEntity.firstname} ${personEntity.lastname}`,
      past12Months,
      y2d,
      may,
      june,
      july,
      netEarningsPrevMonth,
    } as TableDataType;
  });

const Example = () => {
  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [
      { accessorKey: "person", header: "Person" },
      { accessorKey: "past12Months", header: "Past 12 Months" },
      { accessorKey: "y2d", header: "Y2D" },
      { accessorKey: "may", header: "May" },
      { accessorKey: "june", header: "June" },
      { accessorKey: "july", header: "July" },
      { accessorKey: "netEarningsPrevMonth", header: "Net Earnings Prev Month" },
    ],
    []
  );

  const table = useMaterialReactTable({ columns, data: tableData });
  return <MaterialReactTable table={table} />;
};

export default Example;
