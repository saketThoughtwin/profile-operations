export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { updateOrAppendToExcel, readExcel } from "@/lib/excel";
import { cookies } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const sessionCookie = (await cookies()).get("user_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);

    const formData = await request.formData();
    const file = formData.get("picture");

    let picturePath = "";

    if (file && file instanceof File && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Upload to Cloudinary instead of local storage
        picturePath = await uploadToCloudinary(buffer, "profiles");
        console.log("Image uploaded to Cloudinary:", picturePath);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload image to Cloudinary",
          },
          { status: 500 }
        );
      }
    }

    const profileData: any = {
      mobile: session.mobile, // Link to user
      fullName: formData.get("fullName"),
      fatherName: formData.get("fatherName"),
      motherName: formData.get("motherName"),
      fatherOccupation: formData.get("fatherOccupation"),
      motherOccupation: formData.get("motherOccupation"),
      dob: formData.get("dob"),
      education: formData.get("education"),
      address: formData.get("address"),
    };

    if (picturePath) {
      profileData.picture = picturePath;
    }

    await updateOrAppendToExcel("profiles.xlsx", profileData, "mobile");

    return NextResponse.json({ message: "Profile saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const sessionCookie = (await cookies()).get('user_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);

    const profiles = await readExcel('profiles.xlsx');
    // Find profile by mobile (assuming mobile is unique identifier linking user and profile)
    const profile = profiles.find((p: any) => p.mobile === session.mobile);

    if (!profile) {
      return NextResponse.json({}); // Return empty object if no profile found
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
