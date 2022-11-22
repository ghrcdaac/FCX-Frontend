export const code = (dir="subsets/subset-221118121928-f2a0493f-8769-4ff5-9b84-3927f8d03660/") => (
`
import os
import boto3
from pathlib import Path 
s3bucket = 'szg-ghrc-fcx-viz-output'
AWSregion= 'us-east-1' 
s3 = boto3.resource('s3', region_name=AWSregion)
bucket = s3.Bucket(s3bucket)

subDir = 'https://szg-ghrc-fcx-viz-output.s3.amazonaws.com/subsets/subset-221122105403-67bdeeb0-cd2b-42b7-930e-c137572ddeff/'
subsetFolder = subDir.split('subsets/')[1]
subPrefix = f"subsets/{subsetFolder}"

# local path; The same dir, where the download script is.
localDir = subsetFolder
Path(subsetFolder).mkdir(parents=True, exist_ok=True)

print("\nDownload starting...")
for obj in bucket.objects.filter(Prefix=subPrefix):
    s3path, filename = os.path.split(obj.key)
    if(f"{s3path}/" != subPrefix):
        # if file inside another dir
        Dir = s3path.split('/')[-1]
        # create that dir in local
        Path(os.path.join(localDir,Dir)).mkdir(parents=True, exist_ok=True)
        print(f'*Downloading {os.path.join(Dir, filename)}....')
        bucket.download_file(obj.key, os.path.join(localDir, Dir, filename))
    else:
        print(f'*Downloading {filename}....')
        bucket.download_file(obj.key, os.path.join(localDir, filename))

print(f"\nDownload complete. Check './{subsetFolder}' dir.")
`
);
