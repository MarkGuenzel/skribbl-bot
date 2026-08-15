export default class ImageDrawer {
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }

    public draw() {
        console.log("Drawing image...");
        setTimeout(() => {
            const context = this.canvas.getContext("2d");

            context?.beginPath();
            context?.moveTo(50, 50);   // start point
            context?.lineTo(150, 150); // end point
            context?.stroke();          // actually renders it
        }, 2_000);
    }
}