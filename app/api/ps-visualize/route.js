import { fal } from "@fal-ai/client";

export const runtime = "nodejs";

function safeText(s, fallback) {
  if (!s || typeof s !== "string") return fallback;
  return s.slice(0, 60).replace(/[^\w\s#()-]/g, "").trim() || fallback;
}
function safeHex(s, fallback) {
  if (!s || typeof s !== "string") return fallback;
  const v = s.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(v) ? v : fallback;
}

export async function POST(req) {
  const form = await req.formData();
  const image = form.get("image");
  const intensity = Math.max(0, Math.min(1, Number(form.get("intensity") ?? 0.6)));

  const groutLabel = safeText(form.get("grout_label"), "White");
  const groutHex = safeHex(form.get("grout_hex"), "#FFFFFF");
  const siliconeLabel = safeText(form.get("silicone_label"), "White");
  const siliconeHex = safeHex(form.get("silicone_hex"), "#FFFFFF");

  if (!image || typeof image === "string") {
    return Response.json({ error: "Missing image file" }, { status: 400 });
  }

  fal.config({ credentials: process.env.FAL_KEY });

  const imageUrl = await fal.storage.upload(image);

  const prompt = `
Edit a real photo of a shower. Keep it photorealistic and keep the exact angle/fixtures.

Make it look like a real "after" professional restoration:
- Remove mould/black staining from grout.
- Make grout colour: ${groutLabel} (${groutHex}) with natural texture.
- Refresh silicone where it exists. Silicone colour: ${siliconeLabel} (${siliconeHex}).
- Lightly clean tile haze. Do not change tile colour/style.

Keep it believable. Avoid blown highlights.
Intensity: ${intensity}.
`.trim();

  const strength = 0.88 + 0.08 * intensity;
  const guidance = 3.6 + 0.9 * intensity;
  const steps = 30 + Math.round(10 * intensity);

  const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
    input: {
      image_url: imageUrl,
      prompt,
      strength,
      guidance_scale: guidance,
      num_inference_steps: steps,
      output_format: "jpeg",
      enable_safety_checker: true
    },
    logs: false
  });

  const afterUrl = result?.data?.images?.[0]?.url;
  if (!afterUrl) return Response.json({ error: "No image returned" }, { status: 500 });

  return Response.json({ afterUrl });
}
