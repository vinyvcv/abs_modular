import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { COLORS } from '../theme'

export default function ErrorNotFound() {
  return (
    <div className="min-h-screen bg-hapvida-navy text-white flex items-center justify-center text-center p-6">
      <div className="max-w-modal-md">
        <div className="font-display text-hero md:text-hero-lg leading-none font-extrabold tabular-nums tracking-tight">
          404
        </div>
        <h1 className="font-display text-2xl text-white/90 mt-3 font-semibold">
          Página não encontrada
        </h1>
        <p className="text-sm text-white/80 mt-2">
          O endereço acessado não existe ou foi movido dentro do painel Abs Modular.
        </p>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          sx={{
            mt: 3.5,
            px: 3,
            py: 1,
            bgcolor: COLORS.surface.card,
            color: COLORS.brand.navy,
            fontWeight: 700,
            '&:hover': { bgcolor: COLORS.surface.subtle }
          }}
        >
          Voltar para o Início
        </Button>
      </div>
    </div>
  )
}
