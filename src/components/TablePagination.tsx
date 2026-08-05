import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: TablePaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-4 py-4 border-t border-slate-100 bg-slate-50/30 gap-4">
      <div className="text-sm text-slate-500 font-medium order-2 md:order-1">
        {t("pagination.displayRows", {
          from: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
          to: Math.min(currentPage * itemsPerPage, totalItems),
          total: totalItems
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8 order-1 md:order-2 w-full md:w-auto">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-bold text-slate-600">{t("pagination.rowsPerPage")}</p>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
            }}
          >
            <SelectTrigger className="h-9 w-[80px] bg-white border-slate-200 rounded-lg">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl">
              {[10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="rounded-lg">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[100px] items-center justify-center text-sm font-bold text-slate-700">
          {t("pagination.pageOf", { current: currentPage, total: totalPages || 1 })}
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">{t("pagination.first")}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">{t("pagination.previous")}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">{t("pagination.next")}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex rounded-lg border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">{t("pagination.last")}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
