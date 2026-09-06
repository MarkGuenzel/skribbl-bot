import { resolve } from "path";
import { Jimp } from "jimp";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";

type Point = {
    x: number,
    y: number
}
type PointerEventType = "pointerdown" | "pointermove" | "pointerup";

export default class ImageDrawer {
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }

    public async draw(imageUrl: string) {
        const imageBuffer = await this.fetchImageBytes(imageUrl);
        const image = await Jimp.read(imageBuffer);
        console.log(`Original Image: W: ${image.width}, H: ${image.height}`);
        image.resize({
            w: this.canvas.width, 
            h: this.canvas.height
        });
        console.log(`Resized Image: W: ${image.width}, H: ${image.height}`);
    }

    private fetchImageBytes(imageUrl: string, redirectsLeft: number = 5): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const get = imageUrl.startsWith("http:") ? httpGet : httpsGet;
            const requestOptions = {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                    "Referer": new URL(imageUrl).origin,
                },
            };
            get(imageUrl, requestOptions, (response) => {
                const { statusCode, headers } = response;

                if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
                    response.resume();
                    if (redirectsLeft <= 0) {
                        reject(new Error(`Too many redirects fetching the image: ${imageUrl}`))
                        return;
                    }

                    resolve(this.fetchImageBytes(new URL(headers.location, imageUrl).toString(), redirectsLeft - 1));
                    return;
                }

                if (statusCode !== 200) {
                    response.resume();
                    reject(new Error(`Failed to fetch image (${statusCode}): ${imageUrl}`));
                    return;
                }

                const contentType = headers["content-type"] ?? "";
                if (!contentType.startsWith("image/")) {
                    response.resume();
                    reject(new Error(`Expected an image but got content-type "${contentType}" from ${imageUrl}`))
                    return;
                }

                const chunks: Buffer[] = []
                response.on("data", (chunk: Buffer) => chunks.push(chunk))
                response.on("end", () => resolve(Buffer.concat(chunks)))
                response.on("error", reject)
            }).on("error", reject);
        });
    }

    private async drawLine(start: Point, end: Point) {
        const points: Point[] = [];
        const steps = 20
        for (let i = 0; i <= steps; i++) {
            const t = i /steps;
            points.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t
            });
        }

        this.dispatchPointerEvent("pointerdown", points[0], 1);
        for (const point of points.slice(1)) {
            await this.nextFrame();
            this.dispatchPointerEvent("pointermove", point, 1)
        }
        this.dispatchPointerEvent("pointerup", points[points.length - 1], 0)
    }

    private nextFrame() {
        return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }

    private dispatchPointerEvent(type: PointerEventType, point: Point, buttons: 0 | 1) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / this.canvas.width;
        const scaleY = rect.height / this.canvas.height;

        const eventInit: PointerEventInit = {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: rect.left + point.x * scaleX,
            clientY: rect.top + point.y * scaleY,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            button: 0,
            buttons
        }

        this.canvas.dispatchEvent(new PointerEvent(type, eventInit));
    }
}