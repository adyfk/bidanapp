package readmodel

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/appointmentstore"
)

type dynamicFeedbackTestimonial struct {
	createdAt   time.Time
	testimonial ProfessionalTestimonial
}

type professionalFeedbackAggregate struct {
	breakdownCounts map[int]int
	ratingTotal     float64
	recommendCount  int
	reviewCount     int
	testimonials    []dynamicFeedbackTestimonial
}

func applyAppointmentFeedbackOverlays(
	professionals []Professional,
	appointments []appointmentstore.AppointmentRecord,
) []Professional {
	if len(professionals) == 0 || len(appointments) == 0 {
		return professionals
	}

	aggregates := buildProfessionalFeedbackAggregates(appointments)
	if len(aggregates) == 0 {
		return professionals
	}

	nextProfessionals := append([]Professional(nil), professionals...)
	for index, professional := range nextProfessionals {
		aggregate, ok := aggregates[professional.ID]
		if !ok {
			continue
		}

		nextProfessionals[index] = mergeProfessionalFeedbackAggregate(professional, aggregate)
	}

	return nextProfessionals
}

func buildProfessionalFeedbackAggregates(
	appointments []appointmentstore.AppointmentRecord,
) map[string]professionalFeedbackAggregate {
	aggregates := make(map[string]professionalFeedbackAggregate)
	for _, appointment := range appointments {
		professionalID := strings.TrimSpace(appointment.ProfessionalID)
		if professionalID == "" {
			continue
		}

		feedback := decodeOptionalMap[AppointmentFeedback](appointment.CustomerFeedback)
		if feedback == nil {
			continue
		}

		aggregate := aggregates[professionalID]
		if aggregate.breakdownCounts == nil {
			aggregate.breakdownCounts = map[int]int{
				1: 0,
				2: 0,
				3: 0,
				4: 0,
				5: 0,
			}
		}

		ratingBucket := clampRatingBucket(feedback.Rating)
		aggregate.breakdownCounts[ratingBucket] += 1
		aggregate.ratingTotal += feedback.Rating
		aggregate.reviewCount += 1
		if feedback.Rating >= 4 {
			aggregate.recommendCount += 1
		}

		createdAt := appointment.UpdatedAt
		if createdAt.IsZero() {
			createdAt = appointment.CreatedAt
		}
		aggregate.testimonials = append(aggregate.testimonials, dynamicFeedbackTestimonial{
			createdAt: createdAt,
			testimonial: ProfessionalTestimonial{
				Author:    feedback.Author,
				DateLabel: feedback.DateLabel,
				Image:     feedback.Image,
				Quote:     feedback.Quote,
				Rating:    feedback.Rating,
				Role:      feedback.Role,
				ServiceID: appointment.ServiceID,
			},
		})

		aggregates[professionalID] = aggregate
	}

	for professionalID, aggregate := range aggregates {
		sort.SliceStable(aggregate.testimonials, func(leftIndex int, rightIndex int) bool {
			leftItem := aggregate.testimonials[leftIndex]
			rightItem := aggregate.testimonials[rightIndex]
			if !leftItem.createdAt.Equal(rightItem.createdAt) {
				return rightItem.createdAt.Before(leftItem.createdAt)
			}

			return rightItem.testimonial.Author < leftItem.testimonial.Author
		})

		aggregates[professionalID] = aggregate
	}

	return aggregates
}

func mergeProfessionalFeedbackAggregate(
	professional Professional,
	aggregate professionalFeedbackAggregate,
) Professional {
	nextProfessional := professional

	baseReviewCount := parseCount(professional.Reviews)
	combinedReviewCount := baseReviewCount + aggregate.reviewCount
	if combinedReviewCount > 0 {
		if baseReviewCount > 0 && professional.Rating > 0 {
			nextProfessional.Rating = roundToSingleDecimal(
				((professional.Rating * float64(baseReviewCount)) + aggregate.ratingTotal) / float64(combinedReviewCount),
			)
		} else {
			nextProfessional.Rating = roundToSingleDecimal(aggregate.ratingTotal / float64(aggregate.reviewCount))
		}
		nextProfessional.Reviews = strconv.Itoa(combinedReviewCount)
	}

	nextProfessional.FeedbackBreakdown = mergeFeedbackBreakdowns(
		professional.FeedbackBreakdown,
		aggregate.breakdownCounts,
	)

	recommendationRate := mergeRecommendationRate(
		professional.FeedbackSummary.RecommendationRate,
		baseReviewCount,
		aggregate.recommendCount,
		aggregate.reviewCount,
	)
	repeatClientRate := professional.FeedbackSummary.RepeatClientRate
	if strings.TrimSpace(repeatClientRate) == "" && combinedReviewCount > 0 {
		repeatClientRate = "0%"
	}
	nextProfessional.FeedbackSummary = ProfessionalFeedbackSummary{
		RecommendationRate: recommendationRate,
		RepeatClientRate:   repeatClientRate,
	}

	if len(nextProfessional.FeedbackMetrics) == 0 && combinedReviewCount > 0 {
		nextProfessional.FeedbackMetrics = []ProfessionalFeedbackMetric{
			{
				Index:  1,
				Label:  "Rating rata-rata",
				Value:  fmt.Sprintf("%.1f/5", nextProfessional.Rating),
				Detail: "Dihitung dari review pelanggan yang tersimpan.",
			},
			{
				Index:  2,
				Label:  "Total ulasan",
				Value:  strconv.Itoa(combinedReviewCount),
				Detail: "Semua ulasan yang sudah masuk ke platform.",
			},
			{
				Index:  3,
				Label:  "Rekomendasi",
				Value:  recommendationRate,
				Detail: "Pelanggan yang memberi rating 4 atau 5.",
			},
		}
	}

	nextProfessional.Testimonials = mergeTestimonials(aggregate.testimonials, professional.Testimonials)
	return nextProfessional
}

func mergeTestimonials(
	dynamicTestimonials []dynamicFeedbackTestimonial,
	baseTestimonials []ProfessionalTestimonial,
) []ProfessionalTestimonial {
	if len(dynamicTestimonials) == 0 {
		return baseTestimonials
	}

	nextTestimonials := make([]ProfessionalTestimonial, 0, len(dynamicTestimonials)+len(baseTestimonials))
	for _, item := range dynamicTestimonials {
		nextTestimonials = append(nextTestimonials, item.testimonial)
	}
	nextTestimonials = append(nextTestimonials, baseTestimonials...)
	for index := range nextTestimonials {
		nextTestimonials[index].Index = index + 1
	}
	return nextTestimonials
}

func mergeFeedbackBreakdowns(
	baseBreakdowns []ProfessionalFeedbackBreakdown,
	dynamicBreakdownCounts map[int]int,
) []ProfessionalFeedbackBreakdown {
	counts := map[int]int{
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
	}

	for _, breakdown := range baseBreakdowns {
		starCount := parseBreakdownLabel(breakdown.Label)
		if starCount == 0 {
			continue
		}

		counts[starCount] += parseCount(breakdown.Total)
	}
	for starCount, total := range dynamicBreakdownCounts {
		counts[starCount] += total
	}

	totalReviews := 0
	for _, total := range counts {
		totalReviews += total
	}
	if totalReviews == 0 {
		if baseBreakdowns == nil {
			return []ProfessionalFeedbackBreakdown{}
		}
		return baseBreakdowns
	}

	nextBreakdowns := make([]ProfessionalFeedbackBreakdown, 0, 5)
	for index, starCount := range []int{5, 4, 3, 2, 1} {
		total := counts[starCount]
		percentage := 0.0
		if totalReviews > 0 {
			percentage = math.Round((float64(total) / float64(totalReviews)) * 100)
		}
		nextBreakdowns = append(nextBreakdowns, ProfessionalFeedbackBreakdown{
			Index:      index + 1,
			Label:      fmt.Sprintf("%d bintang", starCount),
			Total:      strconv.Itoa(total),
			Percentage: percentage,
		})
	}

	return nextBreakdowns
}

func mergeRecommendationRate(
	baseRecommendationRate string,
	baseReviewCount int,
	dynamicRecommendCount int,
	dynamicReviewCount int,
) string {
	if baseReviewCount == 0 && dynamicReviewCount == 0 {
		return strings.TrimSpace(baseRecommendationRate)
	}

	totalReviews := baseReviewCount + dynamicReviewCount
	if totalReviews == 0 {
		return strings.TrimSpace(baseRecommendationRate)
	}

	baseRecommendRatio := parsePercent(baseRecommendationRate)
	totalRecommendCount := (baseRecommendRatio * float64(baseReviewCount)) + float64(dynamicRecommendCount)
	return formatPercent(totalRecommendCount / float64(totalReviews))
}

func clampRatingBucket(value float64) int {
	ratingBucket := int(math.Round(value))
	if ratingBucket < 1 {
		return 1
	}
	if ratingBucket > 5 {
		return 5
	}
	return ratingBucket
}

func parseBreakdownLabel(value string) int {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return 0
	}

	fields := strings.Fields(trimmed)
	if len(fields) == 0 {
		return 0
	}

	parsed, err := strconv.Atoi(fields[0])
	if err != nil {
		return 0
	}
	return parsed
}

func parseCount(value string) int {
	digits := strings.Map(func(character rune) rune {
		if character >= '0' && character <= '9' {
			return character
		}
		return -1
	}, value)
	if digits == "" {
		return 0
	}

	parsed, err := strconv.Atoi(digits)
	if err != nil {
		return 0
	}
	return parsed
}

func parsePercent(value string) float64 {
	trimmed := strings.TrimSpace(strings.TrimSuffix(value, "%"))
	if trimmed == "" {
		return 0
	}

	parsed, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return 0
	}
	return parsed / 100
}

func formatPercent(ratio float64) string {
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	return fmt.Sprintf("%d%%", int(math.Round(ratio*100)))
}

func roundToSingleDecimal(value float64) float64 {
	return math.Round(value*10) / 10
}
