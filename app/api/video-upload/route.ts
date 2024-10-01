import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure Cloudinary credentials are set
        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({
                error: "Cloudinary credentials not found",
            }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        // Validate file and fields
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 });
        }

        if (!title || !originalSize) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Cloudinary upload
        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    folder: "video-uploads",
                    transformation: [
                        { quality: 'auto', fetch_format: 'mp4' },
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result as CloudinaryUploadResult);
                }
            );
            uploadStream.end(buffer);
        });

        // Prisma database operation
        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        });

        return NextResponse.json(video);

    } catch (error) {
        console.error("Upload video failed:", error);
        return NextResponse.json({ error: "Error uploading video" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
