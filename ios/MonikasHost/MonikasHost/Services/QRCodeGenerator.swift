import CoreImage.CIFilterBuiltins
import UIKit

enum QRCodeGenerator {
    /// Generate a QR code UIImage for `string` at the given pixel size.
    /// Uses the built-in Core Image generator — no external dependency.
    static func make(_ string: String, size: CGFloat = 512) -> UIImage? {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"

        guard let output = filter.outputImage else { return nil }

        // Scale up — the raw output is tiny and blurry.
        let scale = size / output.extent.width
        let scaled = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        let context = CIContext()
        guard let cg = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cg)
    }
}
