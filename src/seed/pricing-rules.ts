export type Line = "vertical" | "ph" | "rolo" | "romana" | "painel";

export type Product = {
  id: number;
  line: Line;
  name: string;
  supplier_cost: number | null;
  cost_unit: "m2" | "linear_m" | "unit";
  max_width_m?: number | null;
};

export type Accessory = {
  id: number;
  line: Line;
  name: string;
  supplier_cost: number | null;
  min_quantity?: number | null;
  max_quantity?: number | null;
  calculation_formula: "width" | "2*height+width";
};

export type CalculationInput = {
  product: Product;
  width_m: number;
  height_m: number;
  quantity?: number;
  margin_percent?: number; // preço venda = custo * (1 + margem/100)
};

export type CalculationResult = {
  area_m2: number;
  charged_area_m2: number;
  supplier_cost_total: number;
  sale_price_total: number;
  warnings: string[];
};

const MIN_AREA_BY_LINE: Record<Line, number> = {
  vertical: 1.5,
  ph: 1.2,
  rolo: 1.2,
  romana: 1.2,
  painel: 1.2,
};

const MAX_WIDTH_BY_LINE: Partial<Record<Line, number>> = {
  ph: 3.0,
};

export function calculateProductCost(input: CalculationInput): CalculationResult {
  const quantity = input.quantity ?? 1;
  const margin = input.margin_percent ?? 0;
  const { product, width_m, height_m } = input;
  const warnings: string[] = [];

  if (width_m <= 0 || height_m <= 0) throw new Error("Largura e altura devem ser maiores que zero.");
  if (!product.supplier_cost) throw new Error(`Produto sem custo cadastrado: ${product.name}`);

  const fixedLineMax = MAX_WIDTH_BY_LINE[product.line];
  if (fixedLineMax && width_m > fixedLineMax) warnings.push(`Largura acima do máximo da linha (${fixedLineMax}m).`);

  if (product.max_width_m && width_m > product.max_width_m) {
    warnings.push(`Largura acima do máximo do tecido (${product.max_width_m}m).`);
  }

  const area = round3(width_m * height_m);
  const minArea = MIN_AREA_BY_LINE[product.line];
  const chargedArea = round3(Math.max(area, minArea));
  const supplierCostTotal = round2(chargedArea * product.supplier_cost * quantity);
  const salePriceTotal = round2(supplierCostTotal * (1 + margin / 100));

  return { area_m2: area, charged_area_m2: chargedArea, supplier_cost_total: supplierCostTotal, sale_price_total: salePriceTotal, warnings };
}

export function calculateAccessoryCost(accessory: Accessory, width_m: number, height_m: number, quantity = 1, margin_percent = 0) {
  if (!accessory.supplier_cost) throw new Error(`Acessório sem custo cadastrado: ${accessory.name}`);

  let measuredQty = accessory.calculation_formula === "2*height+width" ? 2 * height_m + width_m : width_m;
  if (accessory.min_quantity != null) measuredQty = Math.max(measuredQty, accessory.min_quantity);
  if (accessory.max_quantity != null && measuredQty > accessory.max_quantity) {
    return {
      measured_quantity: round3(measuredQty),
      supplier_cost_total: null,
      sale_price_total: null,
      warning: `Medida acima do máximo permitido para ${accessory.name}: ${accessory.max_quantity}m`,
    };
  }

  const supplier = round2(measuredQty * accessory.supplier_cost * quantity);
  const sale = round2(supplier * (1 + margin_percent / 100));
  return { measured_quantity: round3(measuredQty), supplier_cost_total: supplier, sale_price_total: sale, warning: null };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }
