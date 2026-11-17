import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { PRIMARY } from '../utils/format'

export default function ErrorNotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: PRIMARY,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3
      }}
    >
      <Box>
        <Typography sx={{ fontSize: { xs: '20vh', md: '30vh' }, lineHeight: 1, fontWeight: 800 }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ opacity: 0.4, mt: 2 }}>
          Página não encontrada
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          sx={{ mt: 4, bgcolor: '#fff', color: PRIMARY, '&:hover': { bgcolor: '#f0f4ff' } }}
        >
          Voltar para o Início
        </Button>
      </Box>
    </Box>
  )
}
