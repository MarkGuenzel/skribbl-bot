import { resolve } from "path";
import { Jimp, RGBAColor } from "jimp";
import { colorDiff, intToRGBA } from "@jimp/utils";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";

type Point = {
    x: number,
    y: number
}

type GameColor = {
    div: HTMLDivElement,
    color: RGBAColor
}

type Stroke = {
    colorId: number,
    from: Point,
    to: Point
}

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;
type PointerEventType = "pointerdown" | "pointermove" | "pointerup";

export default class ImageDrawer {
    private canvas: HTMLCanvasElement;
    private colors: GameColor[];

    constructor(canvas: HTMLCanvasElement, colorDivs: NodeListOf<HTMLDivElement>) {
        this.canvas = canvas;

        const gameColors: GameColor[] = [];
        for(const colorDiv of colorDivs) {
            const style = colorDiv.style.backgroundColor;
            const match = style.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);

            if (match) {
                const [, r, g, b] = match;

                gameColors.push({
                    div: colorDiv,
                    color: {r: Number(r), g: Number(g), b: Number(b), a: 0}
                })
            }

        }
        this.colors = gameColors;
    }

    public async draw(imageUrl: string) {
        const imageBuffer = await this.fetchImageBytes(imageUrl);
        const image = await Jimp.read(imageBuffer);
        console.log(`Original Image: W: ${image.width}, H: ${image.height}`);
        image.resize({
            w: this.canvas.width, 
            h: this.canvas.height
        });

        const colorIds = this.convertToColorIds(image);
        const strokes = this.createStrokes(colorIds, image.width);

        console.log(colorIds.slice(0, 30));
        console.log(strokes.slice(0, 30));

        for (const stroke of strokes) {
            const strokeColor = this.colors[stroke.colorId].color;
            if (strokeColor.r === 255 && strokeColor.g === 255 && strokeColor.b === 255) {
                 continue;
            }
            await this.executeStroke(stroke);
        }

        console.log("Finished drawing the image");
    }

    private redmeanDistance(c1: RGBAColor, c2: RGBAColor): number {
        const rmean = (c1.r + c2.r) / 2;
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        const weightR = 2 + rmean / 256;
        const weightG = 4.0;
        const weightB = 2 + (255 - rmean) / 256;

        return weightR * dr * dr + weightG * dg * dg + weightB * db * db;
    }

    private convertToColorIds(image: JimpImage): number[] {
        const convertedImage: number[] = [];

        for (let y = 0; y < image.height; y++){
            for (let x = 0; x < image.width; x++) {
                const pixel = intToRGBA(image.getPixelColor(x, y));
                let closestId = 0;
                let closestDistance = Infinity;

                this.colors.forEach((color, id) => {
                    const distance = this.redmeanDistance(color.color, pixel);

                    if (distance < closestDistance) {
                        closestId = id;
                        closestDistance = distance;
                    }
                });

                convertedImage.push(closestId);
            }
        }

        return convertedImage;
    }

    private createStrokes(image: number[], width: number): Stroke[] {
        let currentColor = image[0];
        let firstPoint: Point = {x: 0, y: 0};
        const strokes: Stroke[] = [];

        image.forEach((colorId, idx) => {
            const x = idx % width;
            const y = Math.floor(idx / width);

            if (currentColor !== colorId) {

                strokes.push({
                    colorId: currentColor,
                    from: firstPoint,
                    to: {x: x - 1, y}
                });

                currentColor = colorId;
                firstPoint = {x, y};
            }

            if (x === width - 1) {
                strokes.push({
                    colorId: currentColor,
                    from: firstPoint,
                    to: {x, y}
                });

                if (idx + 1 < image.length) {
                    currentColor = image[idx + 1];
                    firstPoint = {x: 0, y:  y + 1};
                }
            }
        });

        return strokes;
    }

    private selectColor(colorId:  number) {
        this.dispatchPointerEventOn(this.colors[colorId].div, "pointerdown", 1);
        this.dispatchPointerEventOn(this.colors[colorId].div, "pointerup", 0);
    }

    private async executeStroke(stroke: Stroke) {
        this.selectColor(stroke.colorId);
        await this.nextFrame()

        this.dispatchPointerEvent("pointerdown", stroke.from, 1);
        await this.nextFrame();
        this.dispatchPointerEvent("pointermove", stroke.to, 1);
        this.dispatchPointerEvent("pointerup", stroke.to, 0);
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

    private dispatchPointerEventOn(
        element: HTMLElement,
        type: "pointerdown" | "pointerenter" | "pointerup",
        buttons: 0 | 1
    ) {
        const rect = element.getBoundingClientRect();

        const eventInit: PointerEventInit = {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            button: 0,
            buttons,
        };

        element.dispatchEvent(new PointerEvent(type, eventInit));
    }
}