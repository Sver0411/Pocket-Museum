type Topic = { title: string; paragraphs: string[] };

const safety: Topic = {
  title: "Health & Safety",
  paragraphs: [
    "Read the safety information supplied with the system before use. Take regular breaks and stop if you feel uncomfortable.",
    "Adjust the 3D depth slider for a clear picture. Move it all the way down to view the upper screen in 2D.",
  ],
};

function topics(...entries: [string, ...string[]][]): Topic[] {
  return [safety, ...entries.map(([title, ...paragraphs]) => ({ title, paragraphs }))];
}

// Original descriptions of the controls, arranged as an early 3DS electronic manual.
export const manualTopics: Record<string, Topic[]> = {
  camera: topics(
    ["Introduction", "Nintendo 3DS Camera lets you take pictures and view them in the album.", "The upper screen shows the camera image. Use the Touch Screen to choose a camera or open the album."],
    ["Taking Photos", "Start the camera to see a live preview. Switch between the available cameras, then use the shutter on the Touch Screen.", "You can also enter camera mode by pressing L or R on the HOME Menu."],
    ["Viewing Photos", "Open View Photos to browse pictures saved to this browser. Select a picture to enlarge it."],
    ["Camera Effects", "The original software includes effects, a timer and guides for taking photos. This camera supports the browser’s available video sources and JPEG stills."],
  ),
  sound: topics(
    ["Introduction", "Nintendo 3DS Sound is used to record sounds and play music."],
    ["Playing Music", "Choose a track from the local audio library. Use the controls to play, pause or move to another part of the track."],
    ["Recording Sound", "Select Record and allow microphone access. Stop the recording to keep it in the local media library."],
  ),
  mii: topics(
    ["Introduction", "Mii Maker lets you design characters and keep them on the system."],
    ["Creating a Mii", "Choose Create New Mii. Adjust the face, hair and other features, then enter a nickname and save."],
    ["Viewing Mii Characters", "Open the character list to review the Miis you have made."],
  ),
  plaza: topics(
    ["Introduction", "StreetPass Mii Plaza is a gathering place for Mii characters."],
    ["Visiting the Plaza", "Your saved Mii can be viewed in the plaza. The original system could also receive Miis from nearby consoles via StreetPass."],
  ),
  ar: topics(
    ["Introduction", "On the original system, AR Games uses the outer cameras and an AR Card to place game objects on a surface."],
    ["Using the Cameras", "Place the card on a flat surface and keep it in the camera view. The browser recreation provides a camera preview."],
  ),
  face: topics(
    ["Introduction", "Face Raiders on the original system turns photographed faces into airborne targets."],
    ["Taking a Face Photo", "Start the camera and position the face in the centre. This screen can take a picture for the local album."],
  ),
  activity: topics(
    ["Introduction", "Activity Log displays a record of how the system has been used."],
    ["Daily Records", "Choose a date to view the time recorded by this browser. The original system also records steps."],
  ),
  download: topics(
    ["Introduction", "Download Play on the original system lets a host share compatible software with another nearby system."],
    ["Choosing a System", "Choose Nintendo 3DS or Nintendo DS according to the host software. The browser displays the corresponding search screen."],
  ),
  shop: topics(
    ["Introduction", "Nintendo eShop was the system’s catalogue for downloadable software and other content."],
    ["Opening the Shop", "Choose the orange shopping bag from the HOME Menu. The browser displays the local offline state."],
  ),
  settings: topics(
    ["System Settings", "Open the wrench icon to adjust settings. The lower screen is divided into Internet Settings, Parental Controls, Data Management and Other Settings."],
    ["Other Settings", "Use Other Settings to find the profile, date, time and calibration entries."],
  ),
};
