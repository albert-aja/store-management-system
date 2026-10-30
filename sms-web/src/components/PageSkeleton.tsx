import { Box, Container, Skeleton } from "@mui/material";

export default function PageSkeleton() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={240} height={40} />
        <Skeleton variant="text" width={380} height={24} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 1.5 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 1.5 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 1.5 }} />
      </Box>

      <Skeleton
        variant="rectangular"
        width="100%"
        height={450}
        sx={{ borderRadius: 2 }}
      />
    </Container>
  );
}

