import type { EditOp, EditOutput, EditRequest, EditStep, Photo } from "@/lib/api";

/** A pipeline step with a stable client-side id for list keys and selection. */
export type EditorStep = EditStep & { id: string };

export type ToolGroup = "transform" | "enhance" | "ai";

export type ToolDefinition = {
  op: EditOp;
  label: string;
  description: string;
  group: ToolGroup;
  /** Only one instance makes sense in a pipeline (clicking again selects it). */
  single: boolean;
  /** Consumes ImageKit AI credits when previewed or saved. */
  ai: boolean;
  defaults: (photo: Photo) => Omit<EditStep, "op">;
};

export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 4096;
/** ImageKit's AI operations enforce a tighter range for target sizes. */
export const AI_MIN_DIMENSION = 64;

export const ASPECT_PRESETS = ["1:1", "4:5", "3:2", "4:3", "16:9", "9:16", "2:3", "21:9"] as const;

export const FOCUS_OPTIONS = [
  { value: "auto", label: "Auto (subject)" },
  { value: "face", label: "Face" },
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const;

export const FIT_OPTIONS = [
  { value: "cover", label: "Cover (crop to fill)" },
  { value: "contain", label: "Contain (fit inside)" },
  { value: "pad", label: "Pad (fill with colour)" },
  { value: "stretch", label: "Stretch" },
] as const;

export const FORMAT_OPTIONS = [
  { value: "auto", label: "Auto (best for browser)" },
  { value: "jpg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
] as const;

/** Common output sizes. Plain pixel sizes, not platform claims. */
export const SIZE_PRESETS = [
  { label: "Square 1080", width: 1080, height: 1080 },
  { label: "Portrait 1080 × 1350", width: 1080, height: 1350 },
  { label: "Story 1080 × 1920", width: 1080, height: 1920 },
  { label: "Landscape 1920 × 1080", width: 1920, height: 1080 },
  { label: "Banner 1500 × 500", width: 1500, height: 500 },
  { label: "Thumbnail 400 × 400", width: 400, height: 400 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cropDefaults(photo: Photo): Omit<EditStep, "op"> {
  const width = photo.width ?? 1024;
  const height = photo.height ?? 768;
  const cropWidth = Math.max(MIN_DIMENSION, Math.round(width * 0.8));
  const cropHeight = Math.max(MIN_DIMENSION, Math.round(height * 0.8));
  return {
    x: Math.round((width - cropWidth) / 2),
    y: Math.round((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

function aiSizeDefaults(photo: Photo): Omit<EditStep, "op"> {
  return {
    width: clamp(photo.width ?? 1024, AI_MIN_DIMENSION, MAX_DIMENSION),
    height: clamp(photo.height ?? 1024, AI_MIN_DIMENSION, MAX_DIMENSION),
  };
}

export const TOOLS: ToolDefinition[] = [
  { op: "CROP", label: "Crop", description: "Drag a region on the original image.", group: "transform", single: true, ai: false, defaults: cropDefaults },
  { op: "ASPECT_CROP", label: "Aspect ratio", description: "Crop to a ratio around the subject or a chosen edge.", group: "transform", single: true, ai: false, defaults: () => ({ aspectRatio: "1:1", focus: "auto" }) },
  { op: "RESIZE", label: "Resize", description: "Scale to a target size with cover, contain, pad or stretch.", group: "transform", single: false, ai: false, defaults: (photo) => ({ width: clamp(photo.width ?? 1200, MIN_DIMENSION, MAX_DIMENSION), height: clamp(photo.height ?? 800, MIN_DIMENSION, MAX_DIMENSION), fit: "cover", focus: "auto" }) },
  { op: "ROTATE", label: "Rotate", description: "Turn by 90, 180 or 270 degrees.", group: "transform", single: false, ai: false, defaults: () => ({ rotation: 90 }) },
  { op: "FLIP", label: "Flip", description: "Mirror horizontally, vertically or both.", group: "transform", single: false, ai: false, defaults: () => ({ direction: "h" }) },
  { op: "TRIM", label: "Trim edges", description: "Remove flat-coloured borders around the image.", group: "transform", single: true, ai: false, defaults: () => ({}) },
  { op: "GRAYSCALE", label: "Black & white", description: "Convert to grayscale.", group: "enhance", single: true, ai: false, defaults: () => ({}) },
  { op: "CONTRAST", label: "Auto contrast", description: "Stretch the tonal range.", group: "enhance", single: true, ai: false, defaults: () => ({}) },
  { op: "SHARPEN", label: "Sharpen", description: "Bring out edges and detail.", group: "enhance", single: true, ai: false, defaults: () => ({ amount: 3 }) },
  { op: "BLUR", label: "Blur", description: "Soften the whole image.", group: "enhance", single: true, ai: false, defaults: () => ({ amount: 10 }) },
  { op: "RADIUS", label: "Rounded corners", description: "Round the corners by a pixel radius.", group: "enhance", single: true, ai: false, defaults: () => ({ amount: 24 }) },
  { op: "ROUND", label: "Circle", description: "Mask the image into a circle or ellipse.", group: "enhance", single: true, ai: false, defaults: () => ({}) },
  { op: "BORDER", label: "Border", description: "Add a solid frame.", group: "enhance", single: true, ai: false, defaults: () => ({ amount: 12, color: "FFFFFF" }) },
  { op: "OPACITY", label: "Opacity", description: "Make the image translucent (PNG or WebP output).", group: "enhance", single: true, ai: false, defaults: () => ({ amount: 80 }) },
  { op: "REMOVE_BACKGROUND", label: "Remove background", description: "Keeps the subject on a transparent canvas.", group: "ai", single: true, ai: true, defaults: () => ({}) },
  { op: "BACKGROUND_AND_SHADOW", label: "Background & shadow", description: "Removes the background and adds a soft drop shadow.", group: "ai", single: true, ai: true, defaults: () => ({}) },
  { op: "CHANGE_BACKGROUND", label: "Change background", description: "Replaces the background with a scene you describe.", group: "ai", single: true, ai: true, defaults: () => ({ prompt: "" }) },
  { op: "AI_EDIT", label: "Edit with a prompt", description: "Describe the change you want made.", group: "ai", single: false, ai: true, defaults: () => ({ prompt: "" }) },
  { op: "GENERATIVE_FILL", label: "Generative fill", description: "Extends the canvas and fills the new area.", group: "ai", single: true, ai: true, defaults: (photo) => ({ ...aiSizeDefaults(photo), prompt: "" }) },
  { op: "SMART_CROP", label: "Smart crop", description: "Crops to a size around the most interesting region.", group: "ai", single: true, ai: true, defaults: aiSizeDefaults },
  { op: "OBJECT_CROP", label: "Crop to object", description: "Crops around a named object such as “face”.", group: "ai", single: true, ai: true, defaults: () => ({ focusObject: "" }) },
  { op: "RETOUCH", label: "Retouch", description: "Cleans up blemishes and noise.", group: "ai", single: true, ai: true, defaults: () => ({}) },
  { op: "UPSCALE", label: "Upscale", description: "Increases resolution while preserving detail.", group: "ai", single: true, ai: true, defaults: () => ({}) },
];

const toolByOp = new Map(TOOLS.map((tool) => [tool.op, tool]));

export function toolFor(op: EditOp): ToolDefinition {
  const tool = toolByOp.get(op);
  if (!tool) throw new Error(`Unknown edit op ${op}`);
  return tool;
}

export const DEFAULT_OUTPUT: EditOutput = { format: "auto" };

/** True when the output block would change the rendition. */
export function outputIsDefault(output: EditOutput) {
  return (output.format ?? "auto") === "auto" && output.quality === undefined;
}

export function stepUsesAi(step: EditStep) {
  return toolFor(step.op).ai;
}

/** Human-readable one-liner for the pipeline list. */
export function summarizeStep(step: EditStep): string {
  switch (step.op) {
    case "CROP":
      return `${step.width ?? "?"} × ${step.height ?? "?"} at ${step.x ?? 0}, ${step.y ?? 0}`;
    case "ASPECT_CROP":
      return `${step.aspectRatio ?? "1:1"}, focus ${step.focus ?? "auto"}`;
    case "RESIZE": {
      const size = [step.width, step.height].map((value) => value ?? "auto").join(" × ");
      return `${size}, ${step.fit ?? "cover"}`;
    }
    case "ROTATE":
      return `${step.rotation ?? 90}°`;
    case "FLIP":
      return step.direction === "v" ? "Vertical" : step.direction === "hv" ? "Both axes" : "Horizontal";
    case "BLUR":
    case "SHARPEN":
      return `Strength ${step.amount ?? 0}`;
    case "RADIUS":
      return `${step.amount ?? 0} px`;
    case "BORDER":
      return `${step.amount ?? 0} px, #${(step.color ?? "000000").toUpperCase()}`;
    case "OPACITY":
      return `${step.amount ?? 100}%`;
    case "TRIM":
      return step.amount ? `Threshold ${step.amount}` : "Automatic";
    case "CHANGE_BACKGROUND":
    case "AI_EDIT":
      return step.prompt?.trim() ? `“${step.prompt.trim()}”` : "Prompt needed";
    case "GENERATIVE_FILL":
      return `${step.width ?? "?"} × ${step.height ?? "?"}${step.prompt?.trim() ? `, “${step.prompt.trim()}”` : ""}`;
    case "SMART_CROP":
      return `${step.width ?? "?"} × ${step.height ?? "?"}`;
    case "OBJECT_CROP":
      return step.focusObject?.trim() ? `Around “${step.focusObject.trim()}”` : "Object needed";
    default:
      return "";
  }
}

const isInt = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);
const inRange = (value: unknown, min: number, max: number) => isInt(value) && value >= min && value <= max;

/**
 * Mirrors the backend's PhotoEditService checks so the UI can flag a bad step
 * before sending anything. Returns a message, or null when the step is valid.
 */
export function validateStep(step: EditStep, photo: Photo): string | null {
  switch (step.op) {
    case "CROP": {
      if (!inRange(step.width, MIN_DIMENSION, MAX_DIMENSION) || !inRange(step.height, MIN_DIMENSION, MAX_DIMENSION)) {
        return "Crop size must be whole pixels within the image.";
      }
      if (!inRange(step.x, 0, MAX_DIMENSION) || !inRange(step.y, 0, MAX_DIMENSION)) {
        return "Crop position must be zero or more.";
      }
      if (photo.width && step.x! + step.width! > photo.width) return "The crop extends past the right edge.";
      if (photo.height && step.y! + step.height! > photo.height) return "The crop extends past the bottom edge.";
      return null;
    }
    case "ASPECT_CROP":
      return /^\d{1,4}:\d{1,4}$/.test(step.aspectRatio ?? "") && !/^0+:|:0+$/.test(step.aspectRatio ?? "")
        ? null
        : "Aspect ratio must look like 16:9.";
    case "RESIZE": {
      const hasWidth = step.width !== undefined;
      const hasHeight = step.height !== undefined;
      if (!hasWidth && !hasHeight) return "Give a width, a height, or both.";
      if (hasWidth && !inRange(step.width, MIN_DIMENSION, MAX_DIMENSION)) return `Width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}.`;
      if (hasHeight && !inRange(step.height, MIN_DIMENSION, MAX_DIMENSION)) return `Height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}.`;
      if (step.fit === "pad" && step.color && !/^[0-9A-Fa-f]{6}$/.test(step.color)) return "Colour must be a 6-digit hex value.";
      return null;
    }
    case "ROTATE":
      return [90, 180, 270].includes(step.rotation ?? 0) ? null : "Rotation must be 90, 180 or 270.";
    case "FLIP":
      return ["h", "v", "hv"].includes(step.direction ?? "") ? null : "Pick a flip direction.";
    case "BLUR":
      return inRange(step.amount, 1, 100) ? null : "Blur must be between 1 and 100.";
    case "SHARPEN":
      return inRange(step.amount, 1, 10) ? null : "Sharpen must be between 1 and 10.";
    case "RADIUS":
      return inRange(step.amount, 1, 1000) ? null : "Radius must be between 1 and 1000.";
    case "BORDER":
      if (!inRange(step.amount, 1, 200)) return "Border must be between 1 and 200 pixels.";
      return !step.color || /^[0-9A-Fa-f]{6}$/.test(step.color) ? null : "Colour must be a 6-digit hex value.";
    case "OPACITY":
      return inRange(step.amount, 0, 100) ? null : "Opacity must be between 0 and 100.";
    case "TRIM":
      return step.amount === undefined || inRange(step.amount, 1, 99) ? null : "Threshold must be between 1 and 99.";
    case "CHANGE_BACKGROUND":
    case "AI_EDIT":
      return step.prompt?.trim() ? null : "Add a prompt describing the result you want.";
    case "GENERATIVE_FILL":
    case "SMART_CROP":
      return inRange(step.width, AI_MIN_DIMENSION, MAX_DIMENSION) && inRange(step.height, AI_MIN_DIMENSION, MAX_DIMENSION)
        ? null
        : `Width and height must be between ${AI_MIN_DIMENSION} and ${MAX_DIMENSION}.`;
    case "OBJECT_CROP":
      return step.focusObject?.trim() ? null : "Name the object to crop around.";
    default:
      return null;
  }
}

/** Strips client ids and empty fields so the request matches the backend contract. */
export function toEditRequest(steps: EditorStep[], output: EditOutput): EditRequest {
  const cleanSteps: EditStep[] = steps.map((step) => {
    const { id: _id, ...rest } = step;
    void _id;
    const clean: EditStep = { op: rest.op };
    (Object.keys(rest) as Array<keyof EditStep>).forEach((key) => {
      const value = rest[key];
      if (key === "op" || value === undefined || value === null || value === "") return;
      (clean as Record<string, unknown>)[key] = value;
    });
    return clean;
  });
  const cleanOutput: EditOutput = {};
  if (output.format && output.format !== "auto") cleanOutput.format = output.format;
  if (output.quality !== undefined) cleanOutput.quality = output.quality;
  return Object.keys(cleanOutput).length > 0 ? { steps: cleanSteps, output: cleanOutput } : { steps: cleanSteps };
}

/** Parses "16:9" into a width/height ratio, or null. */
export function parseAspectRatio(value: string | undefined): number | null {
  const match = /^(\d{1,4}):(\d{1,4})$/.exec(value ?? "");
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  return w > 0 && h > 0 ? w / h : null;
}
