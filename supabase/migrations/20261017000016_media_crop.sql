-- How each photo sits in its frame (cover polaroid, gallery card, page
-- background): the point of the photo at the frame's center and a zoom where 1
-- fills the frame. Null means centered and filling the frame.

alter table public.media
  add column crop jsonb
  constraint media_crop_shape check (
    crop is null
    or (
      jsonb_typeof(crop) = 'object'
      and jsonb_typeof(crop -> 'x') = 'number'
      and jsonb_typeof(crop -> 'y') = 'number'
      and jsonb_typeof(crop -> 'zoom') = 'number'
      and (crop ->> 'x')::numeric between 0 and 1
      and (crop ->> 'y')::numeric between 0 and 1
      and (crop ->> 'zoom')::numeric between 0.05 and 3
    )
  );

comment on column public.media.crop is
  'Framing of a photo: {x, y} = point of the photo at the frame center (0-1), zoom = 1 fills the frame, < 1 shows more of it, > 1 zooms in.';
