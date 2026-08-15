import { resolve } from "path";

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

    public draw() {
        console.log("Drawing image...");
        setTimeout(() => {
            void this.drawLine({x: 50, y: 50}, {x:150, y: 150});
        }, 2_000);
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