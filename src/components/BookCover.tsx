import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string | null;
  width?: number;
  height?: number;
}

export function BookCover({
  title,
  author,
  coverUrl,
  width = 64,
  height = 96,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      <Box
        sx={{
          width,
          height,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid #E4E0D8',
          bgcolor: '#EFECE4',
        }}
      >
        <Box
          component="img"
          src={coverUrl}
          alt={`Cover artwork for ${title} by ${author}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      aria-label={`${title} by ${author}`}
      sx={{
        width,
        height,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1,
        overflow: 'hidden',
        borderRadius: 1,
        border: '1px solid #D8D2C5',
        background: 'linear-gradient(135deg, #EFECE4 0%, #E5E0D3 55%, #D9D2C2 100%)',
        color: '#18181B',
      }}
    >
      <MenuBookOutlinedIcon sx={{ fontSize: 15, color: 'rgba(30, 58, 138, 0.75)' }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.15,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>
        <Typography noWrap sx={{ mt: 0.25, fontSize: 10, color: 'text.secondary' }}>
          {author}
        </Typography>
      </Box>
    </Box>
  );
}
